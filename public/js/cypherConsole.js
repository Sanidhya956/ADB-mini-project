// Neo4j Cypher Console Controller
const CypherConsole = {
  presets: {
    students_skills: `MATCH (s:Student)-[r:HAS_SKILL]->(sk:Skill)
RETURN s.name AS Student, sk.name AS Skill, r.proficiency AS ProficiencyLevel
ORDER BY s.name, sk.name;`,

    peer_similarity: `MATCH (s1:Student)-[:INTERESTED_IN]->(i:Interest)<-[:INTERESTED_IN]-(s2:Student)
WHERE s1.id < s2.id
RETURN s1.name AS StudentA, s2.name AS StudentB, collect(i.name) AS SharedInterests, count(i) AS CommonCount
ORDER BY CommonCount DESC;`,

    top_sought_skills: `MATCH (s:Student)-[:WANTS_TO_LEARN]->(sk:Skill)
RETURN sk.name AS SkillToLearn, sk.category AS Category, count(s) AS DemandCount
ORDER BY DemandCount DESC;`,

    project_contributors: `MATCH (s:Student)-[r:WORKED_ON]->(p:Project)
RETURN p.title AS Project, s.name AS Contributor, r.role AS Role, p.status AS Status
ORDER BY p.title;`,

    isolated_nodes: `MATCH (s:Student)
WHERE NOT (s)-[:CONNECTED_TO]-()
RETURN s.name AS UnconnectedStudent, s.major AS Major, s.careerGoal AS CareerGoal;`
  },

  init() {
    this.bindEvents();
    // Default initial query
    const textarea = document.getElementById('cypherQueryText');
    if (textarea && !textarea.value) {
      textarea.value = this.presets.students_skills;
    }
  },

  bindEvents() {
    const select = document.getElementById('selectCypherPreset');
    const textarea = document.getElementById('cypherQueryText');
    const runBtn = document.getElementById('btnRunCypher');

    if (select && textarea) {
      select.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val && this.presets[val]) {
          textarea.value = this.presets[val];
        }
      });
    }

    if (runBtn) {
      runBtn.addEventListener('click', () => this.executeQuery());
    }
  },

  async executeQuery() {
    const textarea = document.getElementById('cypherQueryText');
    const resultsContainer = document.getElementById('cypherResultsContainer');
    const countBadge = document.getElementById('cypherRecordCount');
    const timeMeta = document.getElementById('cypherExecutionTime');

    const query = textarea.value.trim();
    if (!query) {
      App.showToast('Please enter a Cypher query', 'error');
      return;
    }

    resultsContainer.innerHTML = '<div class="empty-state">Executing Cypher query...</div>';
    const startTime = performance.now();

    try {
      const res = await App.fetchApi('/api/cypher', {
        method: 'POST',
        body: JSON.stringify({ query })
      });

      const duration = (performance.now() - startTime).toFixed(1);
      timeMeta.textContent = `Completed in ${duration}ms`;

      if (!res.success) {
        throw new Error(res.error || 'Query failed');
      }

      if (res.summary && res.summary.simulated) {
        resultsContainer.innerHTML = `
          <div class="alert-box error" style="margin-bottom:1rem;">
            <strong>Notice:</strong> ${res.summary.message}
          </div>
          <div class="empty-state">
            To execute live Cypher queries against a real database, click <strong>Neo4j Config</strong> in the top header and connect your local or cloud Neo4j instance.
          </div>
        `;
        countBadge.textContent = '0 rows';
        return;
      }

      const records = res.records || [];
      countBadge.textContent = `${records.length} row${records.length === 1 ? '' : 's'}`;

      if (records.length === 0) {
        resultsContainer.innerHTML = '<div class="empty-state">Query returned 0 records.</div>';
        return;
      }

      // Generate HTML Table from columns
      const columns = Object.keys(records[0]);
      const theadHtml = columns.map(c => `<th>${c}</th>`).join('');
      const tbodyHtml = records.map(row => {
        const tds = columns.map(c => {
          let val = row[c];
          if (Array.isArray(val)) {
            val = val.join(', ');
          } else if (typeof val === 'object' && val !== null) {
            val = JSON.stringify(val);
          }
          return `<td>${val !== undefined && val !== null ? val : '—'}</td>`;
        }).join('');
        return `<tr>${tds}</tr>`;
      }).join('');

      resultsContainer.innerHTML = `
        <table class="data-table">
          <thead><tr>${theadHtml}</tr></thead>
          <tbody>${tbodyHtml}</tbody>
        </table>
      `;

    } catch (err) {
      countBadge.textContent = 'Error';
      resultsContainer.innerHTML = `
        <div class="alert-box error">
          <strong>Cypher Execution Error:</strong><br>
          ${err.message}
        </div>
      `;
    }
  }
};
