// Cypher queries for Neo4j Student Networking & Skill Recommendation System

const CYPHER_QUERIES = {
  // Database Schema Initialization & Constraints
  initSchema: [
    'CREATE CONSTRAINT IF NOT EXISTS FOR (s:Student) REQUIRE s.id IS UNIQUE',
    'CREATE CONSTRAINT IF NOT EXISTS FOR (sk:Skill) REQUIRE sk.id IS UNIQUE',
    'CREATE CONSTRAINT IF NOT EXISTS FOR (p:Project) REQUIRE p.id IS UNIQUE',
    'CREATE CONSTRAINT IF NOT EXISTS FOR (i:Interest) REQUIRE i.id IS UNIQUE',
    'CREATE INDEX IF NOT EXISTS FOR (s:Student) ON (s.name)',
    'CREATE INDEX IF NOT EXISTS FOR (sk:Skill) ON (sk.name)'
  ],

  // Node CRUD Queries
  getAllStudents: `
    MATCH (s:Student)
    OPTIONAL MATCH (s)-[r_sk:HAS_SKILL]->(sk:Skill)
    OPTIONAL MATCH (s)-[:WANTS_TO_LEARN]->(w_sk:Skill)
    OPTIONAL MATCH (s)-[r_p:WORKED_ON]->(p:Project)
    OPTIONAL MATCH (s)-[:INTERESTED_IN]->(i:Interest)
    OPTIONAL MATCH (s)-[:CONNECTED_TO]-(peer:Student)
    RETURN s,
      collect(DISTINCT {id: sk.id, name: sk.name, category: sk.category, proficiency: coalesce(r_sk.proficiency, 'Intermediate')}) AS skills,
      collect(DISTINCT {id: w_sk.id, name: w_sk.name, category: w_sk.category}) AS wantsToLearn,
      collect(DISTINCT {id: p.id, title: p.title, role: coalesce(r_p.role, 'Contributor')}) AS projects,
      collect(DISTINCT {id: i.id, name: i.name, category: i.category}) AS interests,
      collect(DISTINCT {id: peer.id, name: peer.name}) AS connections
    ORDER BY s.name ASC
  `,

  getStudentById: `
    MATCH (s:Student {id: $id})
    OPTIONAL MATCH (s)-[r_sk:HAS_SKILL]->(sk:Skill)
    OPTIONAL MATCH (s)-[:WANTS_TO_LEARN]->(w_sk:Skill)
    OPTIONAL MATCH (s)-[r_p:WORKED_ON]->(p:Project)
    OPTIONAL MATCH (s)-[:INTERESTED_IN]->(i:Interest)
    OPTIONAL MATCH (s)-[:CONNECTED_TO]-(peer:Student)
    RETURN s,
      collect(DISTINCT {id: sk.id, name: sk.name, category: sk.category, proficiency: coalesce(r_sk.proficiency, 'Intermediate')}) AS skills,
      collect(DISTINCT {id: w_sk.id, name: w_sk.name, category: w_sk.category}) AS wantsToLearn,
      collect(DISTINCT {id: p.id, title: p.title, role: coalesce(r_p.role, 'Contributor')}) AS projects,
      collect(DISTINCT {id: i.id, name: i.name, category: i.category}) AS interests,
      collect(DISTINCT {id: peer.id, name: peer.name}) AS connections
  `,

  createStudent: `
    CREATE (s:Student {
      id: $id,
      name: $name,
      email: $email,
      major: $major,
      year: $year,
      bio: $bio,
      careerGoal: $careerGoal,
      avatarColor: $avatarColor,
      createdAt: datetime()
    })
    RETURN s
  `,

  updateStudent: `
    MATCH (s:Student {id: $id})
    SET s.name = $name,
        s.email = $email,
        s.major = $major,
        s.year = $year,
        s.bio = $bio,
        s.careerGoal = $careerGoal,
        s.avatarColor = coalesce($avatarColor, s.avatarColor),
        s.updatedAt = datetime()
    RETURN s
  `,

  deleteStudent: `
    MATCH (s:Student {id: $id})
    DETACH DELETE s
    RETURN count(s) AS deletedCount
  `,

  // Skills CRUD
  getAllSkills: `
    MATCH (sk:Skill)
    OPTIONAL MATCH (s:Student)-[:HAS_SKILL]->(sk)
    OPTIONAL MATCH (w:Student)-[:WANTS_TO_LEARN]->(sk)
    OPTIONAL MATCH (p:Project)-[:REQUIRES_SKILL]->(sk)
    RETURN sk,
      count(DISTINCT s) AS studentCount,
      count(DISTINCT w) AS learnersCount,
      count(DISTINCT p) AS projectCount
    ORDER BY sk.name ASC
  `,

  createSkill: `
    MERGE (sk:Skill {id: $id})
    ON CREATE SET
      sk.name = $name,
      sk.category = $category,
      sk.description = $description
    RETURN sk
  `,

  updateSkill: `
    MATCH (sk:Skill {id: $id})
    SET sk.name = $name,
        sk.category = $category,
        sk.description = $description
    RETURN sk
  `,

  deleteSkill: `
    MATCH (sk:Skill {id: $id})
    DETACH DELETE sk
    RETURN count(sk) AS deletedCount
  `,

  // Projects CRUD
  getAllProjects: `
    MATCH (p:Project)
    OPTIONAL MATCH (p)-[:REQUIRES_SKILL]->(sk:Skill)
    OPTIONAL MATCH (s:Student)-[r:WORKED_ON]->(p)
    OPTIONAL MATCH (p)-[:TAGGED_WITH]->(i:Interest)
    RETURN p,
      collect(DISTINCT {id: sk.id, name: sk.name, category: sk.category}) AS requiredSkills,
      collect(DISTINCT {id: s.id, name: s.name, role: r.role}) AS contributors,
      collect(DISTINCT {id: i.id, name: i.name}) AS tags
    ORDER BY p.title ASC
  `,

  createProject: `
    MERGE (p:Project {id: $id})
    ON CREATE SET
      p.title = $title,
      p.description = $description,
      p.domain = $domain,
      p.status = $status,
      p.githubUrl = $githubUrl
    RETURN p
  `,

  updateProject: `
    MATCH (p:Project {id: $id})
    SET p.title = $title,
        p.description = $description,
        p.domain = $domain,
        p.status = $status,
        p.githubUrl = $githubUrl
    RETURN p
  `,

  deleteProject: `
    MATCH (p:Project {id: $id})
    DETACH DELETE p
    RETURN count(p) AS deletedCount
  `,

  // Interests CRUD
  getAllInterests: `
    MATCH (i:Interest)
    OPTIONAL MATCH (s:Student)-[:INTERESTED_IN]->(i)
    OPTIONAL MATCH (p:Project)-[:TAGGED_WITH]->(i)
    RETURN i,
      count(DISTINCT s) AS studentCount,
      count(DISTINCT p) AS projectCount
    ORDER BY i.name ASC
  `,

  createInterest: `
    MERGE (i:Interest {id: $id})
    ON CREATE SET
      i.name = $name,
      i.category = $category
    RETURN i
  `,

  deleteInterest: `
    MATCH (i:Interest {id: $id})
    DETACH DELETE i
    RETURN count(i) AS deletedCount
  `,

  // Relationship Operations
  addStudentSkill: `
    MATCH (s:Student {id: $studentId}), (sk:Skill {id: $skillId})
    MERGE (s)-[r:HAS_SKILL]->(sk)
    SET r.proficiency = coalesce($proficiency, 'Intermediate'),
        r.addedAt = datetime()
    RETURN r
  `,

  removeStudentSkill: `
    MATCH (s:Student {id: $studentId})-[r:HAS_SKILL]->(sk:Skill {id: $skillId})
    DELETE r
  `,

  addWantToLearn: `
    MATCH (s:Student {id: $studentId}), (sk:Skill {id: $skillId})
    MERGE (s)-[r:WANTS_TO_LEARN]->(sk)
    SET r.addedAt = datetime()
    RETURN r
  `,

  removeWantToLearn: `
    MATCH (s:Student {id: $studentId})-[r:WANTS_TO_LEARN]->(sk:Skill {id: $skillId})
    DELETE r
  `,

  addStudentInterest: `
    MATCH (s:Student {id: $studentId}), (i:Interest {id: $interestId})
    MERGE (s)-[r:INTERESTED_IN]->(i)
    RETURN r
  `,

  removeStudentInterest: `
    MATCH (s:Student {id: $studentId})-[r:INTERESTED_IN]->(i:Interest {id: $interestId})
    DELETE r
  `,

  addStudentProject: `
    MATCH (s:Student {id: $studentId}), (p:Project {id: $projectId})
    MERGE (s)-[r:WORKED_ON]->(p)
    SET r.role = coalesce($role, 'Contributor')
    RETURN r
  `,

  removeStudentProject: `
    MATCH (s:Student {id: $studentId})-[r:WORKED_ON]->(p:Project {id: $projectId})
    DELETE r
  `,

  addProjectRequiredSkill: `
    MATCH (p:Project {id: $projectId}), (sk:Skill {id: $skillId})
    MERGE (p)-[r:REQUIRES_SKILL]->(sk)
    RETURN r
  `,

  removeProjectRequiredSkill: `
    MATCH (p:Project {id: $projectId})-[r:REQUIRES_SKILL]->(sk:Skill {id: $skillId})
    DELETE r
  `,

  connectStudents: `
    MATCH (s1:Student {id: $studentId1}), (s2:Student {id: $studentId2})
    WHERE s1 <> s2
    MERGE (s1)-[r:CONNECTED_TO]-(s2)
    ON CREATE SET r.since = date()
    RETURN r
  `,

  disconnectStudents: `
    MATCH (s1:Student {id: $studentId1})-[r:CONNECTED_TO]-(s2:Student {id: $studentId2})
    DELETE r
  `,

  // Graph Visualization Payload (Nodes & Edges)
  getFullGraph: `
    MATCH (n)
    WHERE n:Student OR n:Skill OR n:Project OR n:Interest
    OPTIONAL MATCH (n)-[r]->(m)
    WHERE m:Student OR m:Skill OR m:Project OR m:Interest
    RETURN collect(DISTINCT n) AS nodes, collect(DISTINCT r) AS relationships
  `,

  // Recommendation Queries
  recommendPeers: `
    MATCH (s:Student {id: $studentId})
    MATCH (peer:Student)
    WHERE peer.id <> s.id

    // Shared interests (weight = 3.0)
    OPTIONAL MATCH (s)-[:INTERESTED_IN]->(i:Interest)<-[:INTERESTED_IN]-(peer)
    WITH s, peer, count(DISTINCT i) AS sharedInterestCount, collect(DISTINCT i.name) AS mutualInterests

    // Shared skills (weight = 2.0)
    OPTIONAL MATCH (s)-[:HAS_SKILL]->(sk:Skill)<-[:HAS_SKILL]-(peer)
    WITH s, peer, sharedInterestCount, mutualInterests, count(DISTINCT sk) AS sharedSkillCount, collect(DISTINCT sk.name) AS mutualSkills

    // Shared projects (weight = 3.5)
    OPTIONAL MATCH (s)-[:WORKED_ON]->(p:Project)<-[:WORKED_ON]-(peer)
    WITH s, peer, sharedInterestCount, mutualInterests, sharedSkillCount, mutualSkills,
         count(DISTINCT p) AS sharedProjectCount, collect(DISTINCT p.title) AS mutualProjects

    // Mentorship potential: Peer possesses skills Student wants to learn (weight = 2.5)
    OPTIONAL MATCH (s)-[:WANTS_TO_LEARN]->(wsk:Skill)<-[:HAS_SKILL]-(peer)
    WITH s, peer, sharedInterestCount, mutualInterests, sharedSkillCount, mutualSkills,
         sharedProjectCount, mutualProjects, count(DISTINCT wsk) AS canTeachCount, collect(DISTINCT wsk.name) AS canTeachSkills

    // Reverse mentorship: Student possesses skills Peer wants to learn (weight = 1.5)
    OPTIONAL MATCH (peer)-[:WANTS_TO_LEARN]->(pwsk:Skill)<-[:HAS_SKILL]-(s)
    WITH s, peer, sharedInterestCount, mutualInterests, sharedSkillCount, mutualSkills,
         sharedProjectCount, mutualProjects, canTeachCount, canTeachSkills,
         count(DISTINCT pwsk) AS canLearnCount, collect(DISTINCT pwsk.name) AS canLearnSkills

    // Direct connection status
    OPTIONAL MATCH (s)-[rel:CONNECTED_TO]-(peer)
    WITH peer, sharedInterestCount, mutualInterests, sharedSkillCount, mutualSkills,
         sharedProjectCount, mutualProjects, canTeachCount, canTeachSkills, canLearnCount, canLearnSkills,
         (rel IS NOT NULL) AS isConnected,
         (sharedInterestCount * 3.0 + sharedSkillCount * 2.0 + sharedProjectCount * 3.5 + canTeachCount * 2.5 + canLearnCount * 1.5) AS rawScore
    WHERE rawScore > 0
    RETURN peer,
      rawScore,
      sharedInterestCount,
      mutualInterests,
      sharedSkillCount,
      mutualSkills,
      sharedProjectCount,
      mutualProjects,
      canTeachCount,
      canTeachSkills,
      canLearnCount,
      canLearnSkills,
      isConnected
    ORDER BY rawScore DESC
    LIMIT 10
  `,

  recommendSkills: `
    MATCH (s:Student {id: $studentId})

    // Skills of peers with overlapping interests
    MATCH (s)-[:INTERESTED_IN]->(i:Interest)<-[:INTERESTED_IN]-(peer:Student)-[:HAS_SKILL]->(recSkill:Skill)
    WHERE NOT (s)-[:HAS_SKILL]->(recSkill)
    WITH s, recSkill, count(DISTINCT peer) AS peerCount, collect(DISTINCT peer.name)[0..3] AS peerExamples, collect(DISTINCT i.name) AS relatedInterests

    // Also check if skill is required by projects in the student's areas of interest
    OPTIONAL MATCH (p:Project)-[:REQUIRES_SKILL]->(recSkill)
    OPTIONAL MATCH (p)-[:TAGGED_WITH]->(pi:Interest)<-[:INTERESTED_IN]-(s)
    WITH s, recSkill, peerCount, peerExamples, relatedInterests, count(DISTINCT p) AS projectCount, collect(DISTINCT p.title)[0..2] AS projectExamples

    // Check if student has already added to learning list
    OPTIONAL MATCH (s)-[:WANTS_TO_LEARN]->(recSkill)

    WITH recSkill, peerCount, peerExamples, relatedInterests, projectCount, projectExamples,
         (EXISTS((s)-[:WANTS_TO_LEARN]->(recSkill))) AS isAlreadyTargeted,
         (peerCount * 3.0 + projectCount * 2.0) AS relevanceScore
    RETURN recSkill,
      relevanceScore,
      peerCount,
      peerExamples,
      relatedInterests,
      projectCount,
      projectExamples,
      isAlreadyTargeted
    ORDER BY relevanceScore DESC
    LIMIT 10
  `,

  recommendProjects: `
    MATCH (s:Student {id: $studentId})
    MATCH (p:Project)
    WHERE NOT (s)-[:WORKED_ON]->(p)

    // Required skills
    OPTIONAL MATCH (p)-[:REQUIRES_SKILL]->(reqSkill:Skill)
    WITH s, p, collect(DISTINCT reqSkill) AS allRequiredSkills

    // Matching skills
    OPTIONAL MATCH (s)-[:HAS_SKILL]->(mySkill:Skill)
    WHERE mySkill IN allRequiredSkills
    WITH s, p, allRequiredSkills, collect(DISTINCT mySkill) AS matchingSkills

    // Learning skills that this project would help practice
    OPTIONAL MATCH (s)-[:WANTS_TO_LEARN]->(wSkill:Skill)
    WHERE wSkill IN allRequiredSkills
    WITH s, p, allRequiredSkills, matchingSkills, collect(DISTINCT wSkill) AS learningMatches

    // Shared academic interest
    OPTIONAL MATCH (s)-[:INTERESTED_IN]->(i:Interest)<-[:TAGGED_WITH]-(p)
    WITH s, p, allRequiredSkills, matchingSkills, learningMatches, collect(DISTINCT i.name) AS matchedInterests

    WITH p, allRequiredSkills, matchingSkills, learningMatches, matchedInterests,
         size(allRequiredSkills) AS totalRequired,
         size(matchingSkills) AS matchedCount,
         size(learningMatches) AS learningCount,
         size(matchedInterests) AS interestCount

    WITH p, allRequiredSkills, matchingSkills, learningMatches, matchedInterests,
         totalRequired, matchedCount, learningCount, interestCount,
         CASE WHEN totalRequired > 0 THEN (toFloat(matchedCount) / toFloat(totalRequired)) ELSE 0.4 END AS skillFitRatio

    WITH p, totalRequired, matchedCount, learningCount, interestCount, skillFitRatio,
         [sk IN matchingSkills | sk.name] AS matchedSkillNames,
         [sk IN allRequiredSkills WHERE NOT sk IN matchingSkills | sk.name] AS missingSkillNames,
         [sk IN learningMatches | sk.name] AS learningSkillNames,
         matchedInterests,
         (skillFitRatio * 50.0 + learningCount * 15.0 + interestCount * 20.0 + (CASE WHEN p.status = 'Seeking Contributors' THEN 15.0 ELSE 5.0 END)) AS matchScore

    WHERE matchScore > 10.0
    RETURN p,
      matchScore,
      skillFitRatio,
      totalRequired,
      matchedCount,
      matchedSkillNames,
      missingSkillNames,
      learningSkillNames,
      matchedInterests
    ORDER BY matchScore DESC
    LIMIT 8
  `
};

module.exports = CYPHER_QUERIES;
