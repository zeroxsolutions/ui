# Platform API. Per-application instance config; only created when the app sets
# `instance_config` (a JSON string). Binds to the application's first instance.
resource "clerk_instance_config" "this" {
  for_each = {
    for app_key, app in var.applications : app_key => app.instance_config
    if app.instance_config != null
  }

  application_id = clerk_application.this[each.key].id
  instance_id    = clerk_application.this[each.key].instances[0].instance_id
  config         = each.value
}
