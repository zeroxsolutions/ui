# Custom domains per Pages project - nested for_each over each project's
# `custom_domains` list, keyed "project_key/domain". project_name resolves to the same
# namespaced project name pages-projects.tf creates.
resource "cloudflare_pages_domain" "this" {
  for_each = {
    for pair in flatten([
      for proj_key, proj in var.pages_projects : [
        for domain in proj.custom_domains : { proj_key = proj_key, domain = domain }
      ]
    ]) : "${pair.proj_key}/${pair.domain}" => pair
  }

  account_id   = var.account_id
  project_name = "${var.project_name}-${each.value.proj_key}-${terraform.workspace}"
  name         = each.value.domain
}
