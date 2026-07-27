# Platform API. Per-application instance config; only created when the app sets
# `instance_config`. Binds to the application's instance matching `environment`
# (default production) - resolved from the application's instances list.
resource "clerk_instance_config" "this" {
  for_each = {
    for app_key, app in var.applications : app_key => app.instance_config
    if app.instance_config != null
  }

  application_id = clerk_application.this[each.key].id
  instance_id    = [for inst in clerk_application.this[each.key].instances : inst.instance_id if inst.environment_type == each.value.environment][0]
  config         = each.value.config
}
