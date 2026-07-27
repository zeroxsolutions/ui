resource "neon_database" "main" {
  for_each   = var.databases
  project_id = neon_project.main.id
  branch_id  = neon_project.main.default_branch_id
  name       = each.value
  owner_name = neon_role.main[each.key].name
}
