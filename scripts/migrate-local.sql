-- Step 1: Populate election_posts from elections.post_name
INSERT INTO election_posts (id, election_id, name, status)
SELECT lower(hex(randomblob(16))), id, post_name, 'active' FROM elections;

-- Step 2: Link candidates to the new positions
UPDATE candidates SET post_id = (SELECT id FROM election_posts WHERE election_id = candidates.election_id LIMIT 1);

-- Step 3: Link vote_tallies to the new positions
UPDATE vote_tallies SET post_id = (SELECT id FROM election_posts WHERE election_id = vote_tallies.election_id LIMIT 1);

-- Step 4: Link voting_records to the new positions
UPDATE voting_records SET post_id = (SELECT id FROM election_posts WHERE election_id = voting_records.election_id LIMIT 1);
