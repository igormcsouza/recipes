import os

import aws_cdk as cdk

from stacks.site_stack import SiteStack

app = cdk.App()
# CloudFront certificates must live in us-east-1, so the whole (small) stack does too.
env = cdk.Environment(account=os.environ.get("CDK_DEFAULT_ACCOUNT"), region="us-east-1")
SiteStack(
    app,
    "ReceitasSite",
    domain=app.node.get_context("domain"),
    zone_name=app.node.get_context("zone_name"),
    github_repo=app.node.get_context("github_repo"),
    env=env,
)
cdk.Tags.of(app).add("project", "receitas")
app.synth()
