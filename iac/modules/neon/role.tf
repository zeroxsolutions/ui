resource "neon_role" "main" {
  for_each   = var.databases
  branch_id  = neon_project.main.default_branch_id
  project_id = neon_project.main.id
  name       = "${each.key}_owner"
}

# Neon requires ~30s after role creation before the password field is available
resource "time_sleep" "wait_30_seconds" {
  create_duration = "30s"

  triggers = {
    roles = join(",", [for r in neon_role.main : r.id])
  }
}

output "database_roles" {
  depends_on = [time_sleep.wait_30_seconds]
  sensitive  = true
  value = {
    for key, database_name in var.databases : key => {
      name     = "${key}_owner"
      password = neon_role.main[key].password
    }
  }
}
