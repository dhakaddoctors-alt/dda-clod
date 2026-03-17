
ALTER TABLE doctor_details ADD COLUMN permanent_address TEXT;
ALTER TABLE doctor_details ADD COLUMN current_address TEXT;
ALTER TABLE student_details ADD COLUMN permanent_address TEXT;
ALTER TABLE student_details ADD COLUMN current_address TEXT;
INSERT OR IGNORE INTO form_configs (id, field_name, label, section, is_visible, is_required, category_scope, field_type, storage_mode, show_in_profile, show_in_pdf, show_in_directory, order_index)
VALUES ('44', 'permanentAddress', 'Permanent Address', 'doctor', 1, 0, 'doctor', 'textarea', 'json', 1, 1, 0, 225);
INSERT OR IGNORE INTO form_configs (id, field_name, label, section, is_visible, is_required, category_scope, field_type, storage_mode, show_in_profile, show_in_pdf, show_in_directory, order_index)
VALUES ('45', 'currentAddress', 'Current Address (if different)', 'doctor', 1, 0, 'doctor', 'textarea', 'json', 1, 1, 0, 226);
INSERT OR IGNORE INTO form_configs (id, field_name, label, section, is_visible, is_required, category_scope, field_type, storage_mode, show_in_profile, show_in_pdf, show_in_directory, order_index)
VALUES ('46', 'permanentAddress', 'Permanent Address', 'student', 1, 0, 'student', 'textarea', 'json', 1, 1, 0, 395);
INSERT OR IGNORE INTO form_configs (id, field_name, label, section, is_visible, is_required, category_scope, field_type, storage_mode, show_in_profile, show_in_pdf, show_in_directory, order_index)
VALUES ('47', 'currentAddress', 'Current Address (if different)', 'student', 1, 0, 'student', 'textarea', 'json', 1, 1, 0, 396);
