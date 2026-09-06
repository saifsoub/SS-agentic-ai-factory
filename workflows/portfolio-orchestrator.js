const MISSION_CODE = 'SAGENCY-EMPIRE-ORCH-20260906';

function env(name) {
  const value = process.env[name];
  if (!value) throw new Error(`missing_${name.toLowerCase()}`);
  return value;
}

function headers(extra = {}) {
  const key = env('SUPABASE_SERVICE_ROLE_KEY');
  return {
    apikey: key,
    authorization: `Bearer ${key}`,
    'content-type': 'application/json',
    ...extra
  };
}

async function sb(path, options = {}) {
  const base = env('SUPABASE_URL').replace(/\/$/, '');
  const response = await fetch(`${base}/rest/v1/${path}`, {
    ...options,
    headers: headers(options.headers || {})
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`supabase_${response.status}:${text}`);
  return text ? JSON.parse(text) : null;
}

function norm(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

const companyDefs = [
  { name: 'S/Agency', hints: ['S/ Agency'], lane: 'operations' },
  { name: 'S/University', hints: ['S/ Agent University', 'S/Agentic University'], lane: 'venture' },
  { name: 'DoneAi', hints: ['DoneAi'], lane: 'venture' },
  { name: 'S/Gaming', hints: ['S / Gaming Experience.'], lane: 'venture' },
  { name: 'S/Music Studio', hints: ['Music Studio World', 'Music Studio World (Doneai)'], lane: 'venture' },
  { name: 'Productized AI Workflow Packs', hints: ['Productized AI Workflow Packs'], lane: 'commerce' },
  { name: 'Social/Media', hints: ['Social Work Queue'], lane: 'media' },
  { name: 'Commerce/Shopping', hints: ['Online Shopping'], lane: 'commerce' }
];

function matchesAny(name, hints) {
  const n = norm(name);
  return hints.some((hint) => n === norm(hint) || n.includes(norm(hint)) || norm(hint).includes(n));
}

function scoreProject(project) {
  const urgent = Number(project.urgent_items || 0);
  const open = Number(project.open_items || 0);
  const started = project.status_type === 'started' ? 15 : 0;
  return urgent * 100 + open * 5 + started;
}

function buildPortfolio(projects, workers) {
  return companyDefs.map((company) => {
    const matchedProjects = projects.filter((project) => matchesAny(project.name, company.hints));
    const projectNames = new Set(matchedProjects.map((project) => project.name));
    const matchedWorkers = workers.filter((worker) =>
      Array.isArray(worker.project_names) && worker.project_names.some((name) => projectNames.has(name))
    );
    const openItems = matchedProjects.reduce((sum, p) => sum + Number(p.open_items || 0), 0);
    const urgentItems = matchedProjects.reduce((sum, p) => sum + Number(p.urgent_items || 0), 0);
    const bestProject = [...matchedProjects].sort((a, b) => scoreProject(b) - scoreProject(a))[0] || null;
    return {
      company: company.name,
      lane: company.lane,
      state: matchedProjects.length ? (urgentItems ? 'urgent' : openItems ? 'active' : 'ready') : 'unmapped',
      open_items: openItems,
      urgent_items: urgentItems,
      project_links: matchedProjects.map((p) => ({ name: p.name, url: p.url, status: p.status })),
      workers: matchedWorkers.map((w) => ({
        passport_id: w.passport_id,
        name: w.worker_name,
        operational_status: w.operational_status,
        source_system: w.source_system
      })),
      next_focus: bestProject ? bestProject.name : null
    };
  }).sort((a, b) => (b.urgent_items - a.urgent_items) || (b.open_items - a.open_items));
}

async function updateTask(missionId, actionType, patch) {
  const query = `sally_tasks?mission_id=eq.${encodeURIComponent(missionId)}&action_type=eq.${encodeURIComponent(actionType)}`;
  return sb(query, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() })
  });
}

async function runPortfolioOrchestrator() {
  const missions = await sb(`sally_missions?mission_code=eq.${MISSION_CODE}&select=id,mission_code,title,status,context,plan&limit=1`);
  const mission = missions?.[0];
  if (!mission) {
    return { status: 'not_configured', mission_code: MISSION_CODE };
  }

  const [projects, workers, tasks] = await Promise.all([
    sb('project_control_feed?select=project_id,name,url,status,status_type,teams,workers,open_items,urgent_items,source_updated_at&limit=500'),
    sb('worker_control_feed?select=passport_id,worker_name,worker_type,role,declared_status,operational_status,source_system,project_names,activity,heartbeat_at&limit=500'),
    sb(`sally_tasks?mission_id=eq.${encodeURIComponent(mission.id)}&select=id,action_type,status,agent_id,input,output,requires_approval&limit=100`)
  ]);

  const portfolio = buildPortfolio(projects || [], workers || []);
  const totals = portfolio.reduce((acc, item) => {
    acc.open_items += item.open_items;
    acc.urgent_items += item.urgent_items;
    acc.mapped_companies += item.state === 'unmapped' ? 0 : 1;
    return acc;
  }, { open_items: 0, urgent_items: 0, mapped_companies: 0 });

  const cycle = {
    mission_code: MISSION_CODE,
    generated_at: new Date().toISOString(),
    policy: {
      duplicate_infrastructure: 'deny_when_existing_component_works',
      worker_identity: 'passport_required',
      owner_access: 'required_for_done',
      external_write: 'owner_gate',
      destructive_action: 'owner_gate',
      financial_action: 'owner_gate'
    },
    totals,
    portfolio
  };

  await Promise.all([
    updateTask(mission.id, 'portfolio_architecture', {
      status: 'DONE',
      output: { portfolio, totals },
      completed_at: new Date().toISOString()
    }),
    updateTask(mission.id, 'portfolio_dispatch', {
      status: 'IN_PROGRESS',
      output: {
        current_priority: portfolio.slice(0, 4).map((item) => item.company),
        totals,
        note: 'Dispatch against existing company projects and passported workers; owner-gated actions remain protected.'
      },
      started_at: new Date().toISOString()
    }),
    updateTask(mission.id, 'company_execution', {
      status: 'IN_PROGRESS',
      output: {
        queue: portfolio.filter((item) => item.open_items > 0).map((item) => ({ company: item.company, focus: item.next_focus, open_items: item.open_items, urgent_items: item.urgent_items }))
      },
      started_at: new Date().toISOString()
    }),
    updateTask(mission.id, 'owner_review', {
      status: 'TODO',
      output: {
        acceptance_rule: 'Only surface items that have execution evidence and a direct owner-facing access link.'
      }
    })
  ]);

  await sb('sally_execution_events', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      mission_id: mission.id,
      event_type: 'portfolio_orchestration_cycle',
      severity: 'info',
      payload: cycle
    })
  });

  await sb(`sally_missions?id=eq.${encodeURIComponent(mission.id)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      status: 'in_progress',
      result: { latest_cycle: cycle },
      updated_at: new Date().toISOString()
    })
  });

  return { status: 'orchestrating', mission_id: mission.id, ...cycle };
}

if (require.main === module) {
  runPortfolioOrchestrator()
    .then((result) => console.log(JSON.stringify(result, null, 2)))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { runPortfolioOrchestrator };
