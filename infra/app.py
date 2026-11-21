import os

import aws_cdk as cdk

from stacks.site_stack import SiteStack

app = cdk.App()
# CloudFront certificates must live in us-east-1, so the whole (small) stack does too.
env = cdk.Environment(account=os.environ.get("CDK_DEFAULT_ACCOUNT"), region="us-east-1")
SiteStack(
    app,
    "RecipesSite",
    domain=app.node.get_context("domain"),
    zone_name=app.node.get_context("zone_name"),
    github_repo=app.node.get_context("github_repo"),
    alert_email=app.node.try_get_context("alert_email"),  # cdk.json context; override with -c alert_email=...
    env=env,
)
cdk.Tags.of(app).add("project", "recipes")
app.synth()
