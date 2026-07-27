# Cloudflare Pages project. With `source` set (a github/gitlab repo) Cloudflare builds
# and deploys on push - the Pages-native CI/CD, no GitHub Actions. Pages Functions (a
# functions/ dir in the repo) run as a Worker on the Workers runtime, wired to bindings
# via deployment_configs. Authorize the GitHub/GitLab app on the account once (dashboard)
# before `source` can reference a repo - that OAuth step is not Terraform-manageable.
# Name is namespaced project+workspace, like the other resources, so dev/prod collide
# nowhere in one account.
resource "cloudflare_pages_project" "this" {
  for_each = var.pages_projects

  account_id        = var.account_id
  name              = "${var.project_name}-${each.key}-${terraform.workspace}"
  production_branch = each.value.production_branch

  source             = each.value.source
  build_config       = each.value.build_config
  deployment_configs = each.value.deployment_configs
}
