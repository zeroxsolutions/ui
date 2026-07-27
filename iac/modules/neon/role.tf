resource "neon_role" "main" {
  for_each   = var.databases
  branch_id  = neon_project.main.default_branch_id
  project_id = neon_project.main.id
  name       = "${each.key}_owner"
}

# Neon requires ~30s after role creation before the password field is available.
# Co-located with the role - a provisioning gate, like provisioners on a resource.
resource "time_sleep" "wait_30_seconds" {
  create_duration = "30s"

  triggers = {
    roles = join(",", [for r in neon_role.main : r.id])
  }
}
