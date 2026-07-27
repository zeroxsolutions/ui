# Platform API. One custom domain per (application, domain) pair - nested for_each
# over each app's `domains` list, keyed "app_key/domain.name". References the
# application in applications.tf by its logical key.
resource "clerk_domain" "this" {
  for_each = {
    for pair in flatten([
      for app_key, app in var.applications : [
        for domain in app.domains : { app_key = app_key, domain = domain }
      ]
    ]) : "${pair.app_key}/${pair.domain.name}" => pair
  }

  application_id = clerk_application.this[each.value.app_key].id
  name           = each.value.domain.name
  proxy_path     = each.value.domain.proxy_path
}
