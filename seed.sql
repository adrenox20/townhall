INSERT OR IGNORE INTO categories (id, name, slug, description, icon, color, display_order) VALUES
('cat_academic', 'Academic', 'academic', 'Classes, exams, faculty, and library services', 'book-open', '#2563eb', 1),
('cat_infrastructure', 'Infrastructure', 'infrastructure', 'Buildings, maintenance, labs, and utilities', 'building', '#7c3aed', 2),
('cat_hostel', 'Hostel', 'hostel', 'Residential life, dining, and safety', 'home', '#059669', 3),
('cat_sports', 'Sports & Facilities', 'sports-facilities', 'Sports grounds, gyms, and shared facilities', 'dumbbell', '#d97706', 4),
('cat_it', 'IT & Tech', 'it-tech', 'Campus network, portals, and device support', 'wifi', '#0891b2', 5);

INSERT OR IGNORE INTO categories (id, name, slug, parent_id, icon, color, display_order) VALUES
('cat_library', 'Library', 'library', 'cat_academic', 'library', '#2563eb', 10),
('cat_exam', 'Examination', 'examination', 'cat_academic', 'file-text', '#2563eb', 11),
('cat_faculty', 'Faculty', 'faculty', 'cat_academic', 'graduation-cap', '#2563eb', 12),
('cat_classrooms', 'Classrooms', 'classrooms', 'cat_infrastructure', 'school', '#7c3aed', 20),
('cat_lighting', 'Lighting', 'lighting', 'cat_infrastructure', 'lightbulb', '#7c3aed', 21),
('cat_mess', 'Mess', 'mess', 'cat_hostel', 'utensils', '#059669', 30),
('cat_rooms', 'Rooms', 'rooms', 'cat_hostel', 'bed', '#059669', 31),
('cat_ground', 'Grounds', 'grounds', 'cat_sports', 'goal', '#d97706', 40),
('cat_wifi', 'Wi-Fi', 'wi-fi', 'cat_it', 'wifi', '#0891b2', 50),
('cat_portal', 'Student Portal', 'student-portal', 'cat_it', 'monitor', '#0891b2', 51);

INSERT OR IGNORE INTO tags (id, name, slug, color) VALUES
('tag_urgent', 'urgent', 'urgent', '#dc2626'),
('tag_safety', 'safety', 'safety', '#ea580c'),
('tag_recurring', 'recurring', 'recurring', '#7c3aed'),
('tag_pending_budget', 'pending-budget', 'pending-budget', '#475569'),
('tag_quick_fix', 'quick-fix', 'quick-fix', '#16a34a'),
('tag_needs_survey', 'needs-survey', 'needs-survey', '#0d9488'),
('tag_accessibility', 'accessibility', 'accessibility', '#2563eb'),
('tag_noise', 'noise', 'noise', '#db2777'),
('tag_cleanliness', 'cleanliness', 'cleanliness', '#059669'),
('tag_transport', 'transport', 'transport', '#0891b2');
