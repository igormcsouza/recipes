from pathlib import Path

import aws_cdk as cdk
from aws_cdk import aws_budgets as budgets
from aws_cdk import aws_certificatemanager as acm
from aws_cdk import aws_cloudfront as cloudfront
from aws_cdk import aws_cloudfront_origins as origins
from aws_cdk import aws_iam as iam
from aws_cdk import aws_route53 as route53
from aws_cdk import aws_route53_targets as targets
from aws_cdk import aws_s3 as s3
from constructs import Construct

ROUTER = Path(__file__).resolve().parent.parent / "functions" / "router.js"
GITHUB_OIDC_HOST = "token.actions.githubusercontent.com"
# Static export ships inline bootstrap scripts (theme, RSC payload), so scripts need 'unsafe-inline'.
# Everything else is locked to this origin; GoatCounter is the only third party, and only if enabled.
CSP = (
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://gc.zgo.at; "
    "style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; "
    "connect-src 'self' https://*.goatcounter.com; object-src 'none'; base-uri 'self'; "
    "form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests"
)


class SiteStack(cdk.Stack):
    """Private S3 bucket behind CloudFront (OAC) on a custom domain, plus a GitHub OIDC deploy role for `main`."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        *,
        domain: str,
        zone_name: str,
        github_repo: str,
        alert_email: str | None = None,
        **kwargs,
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        bucket = s3.Bucket(
            self,
            "Site",
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            encryption=s3.BucketEncryption.S3_MANAGED,
            enforce_ssl=True,
            removal_policy=cdk.RemovalPolicy.RETAIN,
        )

        zone = route53.HostedZone.from_lookup(self, "Zone", domain_name=zone_name)
        certificate = acm.Certificate(
            self,
            "Cert",
            domain_name=domain,
            validation=acm.CertificateValidation.from_dns(zone),
        )

        router = cloudfront.Function(
            self,
            "Router",
            code=cloudfront.FunctionCode.from_file(file_path=str(ROUTER)),
            runtime=cloudfront.FunctionRuntime.JS_2_0,
        )

        headers = cloudfront.ResponseHeadersPolicy(
            self,
            "Headers",
            security_headers_behavior=cloudfront.ResponseSecurityHeadersBehavior(
                content_security_policy=cloudfront.ResponseHeadersContentSecurityPolicy(
                    content_security_policy=CSP, override=True
                ),
                strict_transport_security=cloudfront.ResponseHeadersStrictTransportSecurity(
                    access_control_max_age=cdk.Duration.days(365), include_subdomains=False, override=True
                ),
                content_type_options=cloudfront.ResponseHeadersContentTypeOptions(override=True),
                frame_options=cloudfront.ResponseHeadersFrameOptions(
                    frame_option=cloudfront.HeadersFrameOption.DENY, override=True
                ),
                referrer_policy=cloudfront.ResponseHeadersReferrerPolicy(
                    referrer_policy=cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN, override=True
                ),
            ),
            custom_headers_behavior=cloudfront.ResponseCustomHeadersBehavior(
                custom_headers=[
                    cloudfront.ResponseCustomHeader(
                        header="Permissions-Policy",
                        value="camera=(), microphone=(), geolocation=(), payment=(), usb=()",
                        override=True,
                    ),
                    cloudfront.ResponseCustomHeader(
                        header="Cross-Origin-Opener-Policy", value="same-origin", override=True
                    ),
                ]
            ),
        )

        not_found = cloudfront.ErrorResponse
        distribution = cloudfront.Distribution(
            self,
            "Cdn",
            domain_names=[domain],
            certificate=certificate,
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3BucketOrigin.with_origin_access_control(bucket),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED,
                response_headers_policy=headers,
                compress=True,
                function_associations=[
                    cloudfront.FunctionAssociation(
                        function=router, event_type=cloudfront.FunctionEventType.VIEWER_REQUEST
                    )
                ],
            ),
            error_responses=[
                not_found(http_status=code, response_http_status=404, response_page_path="/404.html")
                for code in (403, 404)
            ],
            http_version=cloudfront.HttpVersion.HTTP2_AND_3,
            minimum_protocol_version=cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
            price_class=cloudfront.PriceClass.PRICE_CLASS_100,
        )

        record_target = route53.RecordTarget.from_alias(targets.CloudFrontTarget(distribution))
        route53.ARecord(self, "A", zone=zone, record_name=domain, target=record_target)
        route53.AaaaRecord(self, "Aaaa", zone=zone, record_name=domain, target=record_target)

        # The GitHub OIDC provider is one-per-account and already exists; import it, never create it.
        provider_arn = f"arn:aws:iam::{self.account}:oidc-provider/{GITHUB_OIDC_HOST}"
        role = iam.Role(
            self,
            "DeployRole",
            assumed_by=iam.WebIdentityPrincipal(
                provider_arn,
                conditions={
                    "StringEquals": {
                        f"{GITHUB_OIDC_HOST}:aud": "sts.amazonaws.com",
                        f"{GITHUB_OIDC_HOST}:sub": f"repo:{github_repo}:ref:refs/heads/main",
                    }
                },
            ),
            max_session_duration=cdk.Duration.hours(1),
        )
        role.add_to_policy(iam.PolicyStatement(actions=["s3:ListBucket"], resources=[bucket.bucket_arn]))
        role.add_to_policy(
            iam.PolicyStatement(
                actions=["s3:PutObject", "s3:DeleteObject"],
                resources=[bucket.arn_for_objects("*")],
            )
        )
        role.add_to_policy(
            iam.PolicyStatement(
                actions=["cloudfront:CreateInvalidation"],
                resources=[
                    self.format_arn(
                        service="cloudfront",
                        region="",
                        resource="distribution",
                        resource_name=distribution.distribution_id,
                    )
                ],
            )
        )
        role.add_to_policy(iam.PolicyStatement(actions=["cloudformation:DescribeStacks"], resources=[self.stack_id]))

        if alert_email:
            # Anything this site bills is unexpected (free tier covers it). Scoped by the `project=recipes` cost
            # tag (CDK tags every resource; the tag must be activated once in Billing, see README) so other
            # projects in the account and the Route 53 zones never trip it. Email comes from cdk.json context.
            budgets.CfnBudget(
                self,
                "CostAlarm",
                budget=budgets.CfnBudget.BudgetDataProperty(
                    budget_name="recipes-site-unexpected-cost",
                    budget_type="COST",
                    time_unit="MONTHLY",
                    budget_limit=budgets.CfnBudget.SpendProperty(amount=0.01, unit="USD"),
                    filter_expression=budgets.CfnBudget.ExpressionProperty(
                        tags=budgets.CfnBudget.TagValuesProperty(
                            key="project", values=["recipes"], match_options=["EQUALS"]
                        )
                    ),
                ),
                notifications_with_subscribers=[
                    budgets.CfnBudget.NotificationWithSubscribersProperty(
                        notification=budgets.CfnBudget.NotificationProperty(
                            notification_type=notification,
                            comparison_operator="GREATER_THAN",
                            threshold=threshold,
                            threshold_type="PERCENTAGE",
                        ),
                        subscribers=[
                            budgets.CfnBudget.SubscriberProperty(subscription_type="EMAIL", address=alert_email)
                        ],
                    )
                    for notification, threshold in (("ACTUAL", 100), ("FORECASTED", 100))
                ],
            )

        cdk.CfnOutput(self, "BucketName", value=bucket.bucket_name)
        cdk.CfnOutput(self, "DistributionId", value=distribution.distribution_id)
        cdk.CfnOutput(self, "DeployRoleArn", value=role.role_arn)
        cdk.CfnOutput(self, "SiteUrl", value=f"https://{domain}")
