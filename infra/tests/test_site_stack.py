import aws_cdk as cdk
from aws_cdk.assertions import Match, Template

from stacks.site_stack import SiteStack


def template(**extra) -> Template:
    stack = SiteStack(
        cdk.App(),
        "Test",
        domain="recipes.example.com",
        zone_name="example.com",
        github_repo="octo/recipes",
        **extra,
        env=cdk.Environment(account="111111111111", region="us-east-1"),
    )
    return Template.from_stack(stack)


def test_bucket_is_private_and_encrypted():
    template().has_resource_properties(
        "AWS::S3::Bucket",
        {
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": True,
                "BlockPublicPolicy": True,
                "IgnorePublicAcls": True,
                "RestrictPublicBuckets": True,
            },
            "BucketEncryption": Match.any_value(),
        },
    )


def test_distribution_serves_the_domain_over_https_with_router():
    t = template()
    t.has_resource_properties(
        "AWS::CloudFront::Distribution",
        {
            "DistributionConfig": Match.object_like(
                {
                    "Aliases": ["recipes.example.com"],
                    "DefaultCacheBehavior": Match.object_like(
                        {
                            "ViewerProtocolPolicy": "redirect-to-https",
                            "FunctionAssociations": [Match.object_like({"EventType": "viewer-request"})],
                        }
                    ),
                    "CustomErrorResponses": [
                        Match.object_like({"ErrorCode": 403, "ResponseCode": 404, "ResponsePagePath": "/404.html"}),
                        Match.object_like({"ErrorCode": 404, "ResponseCode": 404, "ResponsePagePath": "/404.html"}),
                    ],
                }
            )
        },
    )
    t.has_resource_properties(
        "AWS::CloudFront::Function", {"FunctionConfig": {"Runtime": "cloudfront-js-2.0", "Comment": Match.any_value()}}
    )
    t.resource_count_is("AWS::CloudFront::OriginAccessControl", 1)


def test_dns_records_and_certificate():
    t = template()
    t.has_resource_properties(
        "AWS::CertificateManager::Certificate", {"DomainName": "recipes.example.com", "ValidationMethod": "DNS"}
    )
    t.resource_count_is("AWS::Route53::RecordSet", 2)  # A and AAAA; ACM validates through the zone id


def test_deploy_role_trusts_only_main_of_that_repo():
    template().has_resource_properties(
        "AWS::IAM::Role",
        {
            "AssumeRolePolicyDocument": {
                "Statement": [
                    Match.object_like(
                        {
                            "Action": "sts:AssumeRoleWithWebIdentity",
                            "Condition": {
                                "StringEquals": {
                                    "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
                                    "token.actions.githubusercontent.com:sub": "repo:octo/recipes:ref:refs/heads/main",
                                }
                            },
                        }
                    )
                ],
                "Version": "2012-10-17",
            }
        },
    )


def test_no_wildcard_iam_actions():
    for policy in template().find_resources("AWS::IAM::Policy").values():
        for stmt in policy["Properties"]["PolicyDocument"]["Statement"]:
            actions = stmt["Action"] if isinstance(stmt["Action"], list) else [stmt["Action"]]
            assert all("*" not in a for a in actions)


def test_security_headers_are_enforced():
    template().has_resource_properties(
        "AWS::CloudFront::ResponseHeadersPolicy",
        {
            "ResponseHeadersPolicyConfig": Match.object_like(
                {
                    "SecurityHeadersConfig": Match.object_like(
                        {
                            "ContentSecurityPolicy": Match.object_like(
                                {"ContentSecurityPolicy": Match.string_like_regexp("frame-ancestors 'none'")}
                            ),
                            "StrictTransportSecurity": Match.object_like({"AccessControlMaxAgeSec": 31536000}),
                            "FrameOptions": {"FrameOption": "DENY", "Override": True},
                            "ContentTypeOptions": {"Override": True},
                        }
                    )
                }
            )
        },
    )


def test_cost_alarm_only_when_an_email_is_given():
    template().resource_count_is("AWS::Budgets::Budget", 0)
    with_alarm = template(alert_email="me@example.com")
    with_alarm.has_resource_properties(
        "AWS::Budgets::Budget",
        {
            "Budget": Match.object_like(
                {
                    "BudgetLimit": {"Amount": 0.01, "Unit": "USD"},
                    "BudgetName": "recipes-site-unexpected-cost",
                    "FilterExpression": {"Tags": {"Key": "project", "Values": ["recipes"], "MatchOptions": ["EQUALS"]}},
                }
            ),
            "NotificationsWithSubscribers": Match.array_with(
                [
                    Match.object_like(
                        {
                            "Notification": Match.object_like({"NotificationType": "ACTUAL"}),
                            "Subscribers": [{"SubscriptionType": "EMAIL", "Address": "me@example.com"}],
                        }
                    )
                ]
            ),
        },
    )
