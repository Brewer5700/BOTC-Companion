// Universal Core Coordination State Variables
var players = [];
var day = 1;
var pendingVoters = [];
var vortoxMode = false;

// Sub-App Deep Timeline Logs
var nominationsToday = [];
var nominationsHistory = []; // Array of {day: X, items: [...]}

var empathToday = [];
var empathHistory = [];

var gossipToday = [];
var gossipHistory = [];

var jugglerToday = [];
var jugglerHistory = [];

var savantGrid = {};

function show(id){ document.getElementById(id).classList.remove('hidden'); }
function hide(id){ document.getElementById(id).classList.add('hidden'); }
function showPhase(p){ ['phase-init','phase-setup','phase-track'].forEach(hide); show(p); }

function initPlayers(){
  var n = parseInt(document.getElementById('player-count').value) || 10;
  players = [];
  for(var i = 0; i < n; i++) players.push({name: 'Player '+(i+1), id: i, alive: true});
  showPhase('phase-setup');
  renderNameInputs();
  renderCircle('circle-setup', false);
}

function renderNameInputs(){
  var c = document.getElementById('name-inputs');
  c.innerHTML = '';
  players.forEach(function(p, i){
    var inp = document.createElement('input');
    inp.type = 'text';
    inp.placeholder = 'Player '+(i+1);
    inp.value = p.name === 'Player '+(i+1) ? '' : p.name;
    inp.addEventListener('input', function(e){
      players[i].name = e.target.value.trim() || 'Player '+(i+1);
      renderCircle('circle-setup', false);
    });
    c.appendChild(inp);
  });
}

function isVoter(pid){ return pendingVoters.indexOf(pid) !== -1; }

function renderCircle(containerId, clickable){
  var c = document.getElementById(containerId);
  if(!c) return;

  c.innerHTML = '';

  var rect = c.getBoundingClientRect();
  var n = players.length;
  if(!n) return;

  var cx = rect.width / 2;
  var cy = rect.height / 2;
  var r = Math.min(rect.width, rect.height) / 2 - 40;

  players.forEach(function(p, i){
    var angle = (2 * Math.PI * i / n) - Math.PI / 2;
    var x = cx + r * Math.cos(angle);
    var y = cy + r * Math.sin(angle);

    var tok = document.createElement('div');
    tok.className = 'token';
    tok.style.left = x + 'px';
    tok.style.top = y + 'px';

    var initials = p.name.split(' ').map(function(w){ return w[0] || ''; }).join('').slice(0, 2).toUpperCase();

    var circ = document.createElement('div');
    circ.id = 'tok-' + p.id;
    circ.className = 'token-circle' + (clickable ? ' clickable' : '');
    circ.textContent = initials;
    circ.setAttribute('data-initials', initials);

    if(!p.alive) { circ.style.opacity = '0.35'; circ.style.borderStyle = 'dashed'; }

    var nameEl = document.createElement('div');
    nameEl.id = 'tokname-' + p.id;
    nameEl.className = 'token-name';
    nameEl.textContent = p.name + (!p.alive ? ' 💀' : '');

    if(clickable){
      tok.style.cursor = 'pointer';
      var pid = p.id;

      tok.onclick = function(){ toggleVoter(pid); };
      tok.oncontextmenu = function(e) {
        e.preventDefault();
        players[pid].alive = !players[pid].alive;
        renderCircle('circle-track', true);
        renderEmpathToday();
        renderEmpathHistory();
        renderGossipToday();
        renderGossipHistory();
        renderJugglerToday();
        renderJugglerHistory();
      };
    }

    tok.appendChild(circ);
    tok.appendChild(nameEl);
    c.appendChild(tok);
  });
}

function toggleVoter(pid){
  var idx = pendingVoters.indexOf(pid);
  if(idx === -1) pendingVoters.push(pid);
  else pendingVoters.splice(idx, 1);

  var voted = isVoter(pid);
  var circ = document.querySelector('#circle-track #tok-' + pid);
  var nameEl = document.querySelector('#circle-track #tokname-' + pid);

  if(circ){
    circ.textContent = voted ? '✓' : circ.getAttribute('data-initials');
    circ.classList.toggle('voted', voted);
  }
  if(nameEl) nameEl.classList.toggle('voted', voted);
  updateVoterPreview();
}

function updateVoterPreview(){
  var el = document.getElementById('voter-preview');
  if(!el) return;
  if(!pendingVoters.length){ el.textContent = 'No voters selected — click tokens above'; return; }
  el.textContent = 'Voters: ' + pendingVoters.map(function(id){ return getPlayerName(id); }).join(', ');
}

function toggleVortexReality() {
  vortoxMode = !vortoxMode;

  var btn = document.getElementById('vortox-btn');
  var banner = document.getElementById('reality-banner-label');

  if (vortoxMode) {
    if(btn) btn.textContent = 'Return to Normal';
    if (banner) banner.innerHTML = '🔮 Logic Reality: <strong>VORTOX WORLD (Townsfolk info MUST be false)</strong>';
    var realityBanner = document.getElementById('reality-banner');
    if (realityBanner) realityBanner.classList.add('vortox-active');
  } else {
    if(btn) btn.textContent = 'Split Reality (Vortox)';
    if (banner) banner.innerHTML = '🔮 Logic Reality: <strong>Standard Rules</strong>';
    var realityBanner2 = document.getElementById('reality-banner');
    if (realityBanner2) realityBanner2.classList.remove('vortox-active');
  }

  renderEmpathToday();
  renderEmpathHistory();
}

function nextDay() {
  if (nominationsToday.length) {
    nominationsHistory.push({ day: day, items: nominationsToday.slice() });
  }
  if (empathToday.length) {
    empathHistory.push({ day: day, items: empathToday.slice() });
  }
  if (gossipToday.length) {
    gossipHistory.push({ day: day, items: gossipToday.slice() });
  }
  if (jugglerToday.length) {
    jugglerHistory.push({ day: day, items: jugglerToday.slice() });
  }

  day += 1;
  pendingVoters = [];
  nominationsToday = [];
  empathToday = [];
  gossipToday = [];
  jugglerToday = [];

  document.getElementById('global-day-header').textContent = 'Day ' + day;
  renderCircle('circle-track', true);
  updateVoterPreview();
  renderNomList();
  renderSummary();
  renderNomHistory();
  renderEmpathToday();
  renderEmpathHistory();
  renderGossipToday();
  renderGossipHistory();
  renderJugglerToday();
  renderJugglerHistory();
}

function showClearModal(){
  show('clear-modal');
}

function hideClearModal(){
  hide('clear-modal');
}

function clearKeepPlayers(){
  hideClearModal();
  day = 1;
  pendingVoters = [];
  nominationsToday = []; nominationsHistory = [];
  empathToday = []; empathHistory = [];
  gossipToday = []; gossipHistory = [];
  jugglerToday = []; jugglerHistory = [];
  savantGrid = {};
  document.getElementById('global-day-header').textContent = 'Day 1';
  renderCircle('circle-track', true);
  updateVoterPreview();
  renderNomList();
  renderSummary();
  renderNomHistory();
  renderEmpathToday();
  renderEmpathHistory();
  renderGossipToday();
  renderGossipHistory();
  renderJugglerToday();
  renderJugglerHistory();
}

function clearEditPlayers(){
  hideClearModal();
  day = 1;
  pendingVoters = [];
  nominationsToday = []; nominationsHistory = [];
  empathToday = []; empathHistory = [];
  gossipToday = []; gossipHistory = [];
  jugglerToday = []; jugglerHistory = [];
  savantGrid = {};
  showPhase('phase-setup');
  renderNameInputs();
  renderCircle('circle-setup', false);
}

function switchTab(targetTabId) {
  document.querySelectorAll('.tab-content').forEach(function(el) { el.classList.add('hidden'); });
  document.querySelectorAll('.tab-btn').forEach(function(el) { el.classList.remove('active'); });

  document.getElementById(targetTabId).classList.remove('hidden');
  document.getElementById('btn-' + targetTabId).classList.add('active');

  if(targetTabId === 'tab-noms') {
    ['sel-nominator','sel-nominee'].forEach(populateSelect);
  } else if(targetTabId === 'tab-empath') {
    populateSelect('empath-player');
    renderEmpathToday();
    renderEmpathHistory();
  } else if (targetTabId === 'tab-gossip') {
    populateSelect('gossip-player');
    renderGossipToday();
    renderGossipHistory();
  } else if (targetTabId === 'tab-juggler') {
    populateSelect('juggler-player');
    renderJugglerToday();
    renderJugglerHistory();
  } else if (targetTabId === 'tab-savant') {
    renderSavantMatrix();
  }
}

function populateSelect(selectId) {
  var s = document.getElementById(selectId);
  if(!s) return;
  var currentSelection = s.value;
  s.innerHTML = '';
  players.forEach(function(p){
    var o = document.createElement('option');
    o.value = p.id;
    o.textContent = p.name + (!p.alive ? ' (Dead)' : '');
    s.appendChild(o);
  });
  if(currentSelection !== '') s.value = currentSelection;
}

function generateJugglerInputs() {
  var container = document.getElementById('juggler-guesses-inputs');
  if(!container) return;

  container.innerHTML = '';
  for(var i = 1; i <= 5; i++) {
    var line = document.createElement('div');
    line.className = 'flex';
    line.style.gap = '10px';

    var pSel = document.createElement('select');
    pSel.id = 'jug-p-' + i;
    pSel.innerHTML = '<option value="">-- Target Player --</option>';
    players.forEach(function(p){
      pSel.innerHTML += '<option value="'+p.id+'">'+p.name+'</option>';
    });

    var rInp = document.createElement('input');
    rInp.type = 'text';
    rInp.id = 'jug-r-' + i;
    rInp.placeholder = 'Guessed Role (e.g., Empath)';

    line.appendChild(pSel);
    line.appendChild(rInp);
    container.appendChild(line);
  }
}

function startGame(){
  document.querySelectorAll('#name-inputs input').forEach(function(inp, i){
    players[i].name = inp.value.trim() || 'Player '+(i+1);
  });
  day = 1; pendingVoters = [];
  nominationsToday = []; nominationsHistory = [];
  empathToday = []; empathHistory = [];
  gossipToday = []; gossipHistory = [];
  jugglerToday = []; jugglerHistory = [];
  savantGrid = {};
  vortoxMode = false;

  showPhase('phase-track');
  document.getElementById('global-day-header').textContent = 'Day 1';
  var btn = document.getElementById('vortox-btn');
  var banner = document.getElementById('reality-banner-label');
  if(btn) btn.textContent = 'Split Reality (Vortox)';
  if (banner) banner.innerHTML = '🔮 Logic Reality: <strong>Standard Rules</strong>';
  var realityBanner = document.getElementById('reality-banner');
  if (realityBanner) realityBanner.classList.remove('vortox-active');

  renderCircle('circle-track', true);

  generateJugglerInputs();
  switchTab('tab-noms');
  renderNomList();
  renderSummary();
  updateVoterPreview();
}

function getPlayerName(id){ 
  if(id === "" || id === undefined || id === null) return "";
  var p = players.find(function(p){ return p.id === parseInt(id); }); 
  return p ? p.name : '?'; 
}

// ==========================================
// MODULE 1: NOMINATIONS TRACKING
// ==========================================
function addNomination(){
  var nomId = parseInt(document.getElementById('sel-nominator').value);
  var neeId = parseInt(document.getElementById('sel-nominee').value);
  nominationsToday.push({nominator: nomId, nominee: neeId, voters: pendingVoters.slice()});
  pendingVoters = [];
  renderCircle('circle-track', true);
  updateVoterPreview();
  renderNomList();
  renderSummary();
}

function renderNomList(){
  var c = document.getElementById('nom-list');
  if(!c) return;
  if(!nominationsToday.length){ c.innerHTML = '<div style="color:#5a3d18;font-size:13px;text-align:center;padding:1rem">No nominations logged yet</div>'; return; }
  c.innerHTML = '';
  nominationsToday.forEach(function(n){
    var d = document.createElement('div');
    d.className = 'nom-card';
    var voterNames = n.voters.map(getPlayerName).join(', ') || 'No votes';
    d.innerHTML = '<div class="nom-line"><strong>'+getPlayerName(n.nominator)+'</strong> nominated <strong>'+getPlayerName(n.nominee)+'</strong></div><div class="voters">Voted: '+voterNames+'</div>';
    c.appendChild(d);
  });
}

function renderSummary(){
  var daily = document.getElementById('daily-summary');
  var nomGroup = document.getElementById('summary-nominators');
  var voteGroup = document.getElementById('summary-voters');
  if(!daily || !nomGroup || !voteGroup) return;

  if(!nominationsToday.length){ hide('daily-summary'); return; }
  show('daily-summary');
  var nomSet = {}, voteSet = {};
  nominationsToday.forEach(function(n){
    nomSet[n.nominator] = true;
    n.voters.forEach(function(v){ voteSet[v] = true; });
  });
  nomGroup.innerHTML = Object.keys(nomSet).map(function(id){ return '<div class="pill">'+getPlayerName(parseInt(id))+'</div>'; }).join('');
  var vkeys = Object.keys(voteSet);
  voteGroup.innerHTML = vkeys.length ? vkeys.map(function(id){ return '<div class="pill">'+getPlayerName(parseInt(id))+'</div>'; }).join('') : '<span style="color:#5a3d18;font-size:12px">Nobody voted</span>';
}

function renderNomHistory() {
  var c = document.getElementById('nom-history-list');
  if(!c) return;
  if(!nominationsHistory.length) { hide('nom-history-card'); return; }
  show('nom-history-card');
  c.innerHTML = '';
  nominationsHistory.slice().reverse().forEach(function(h) {
    var wrapper = document.createElement('div');
    wrapper.className = 'day-history-container';
    wrapper.innerHTML = '<div class="day-history-title">Day ' + h.day + '</div>';
    h.items.forEach(function(n) {
      var inner = document.createElement('div');
      inner.style.marginBottom = '6px';
      var voterNames = n.voters.map(getPlayerName).join(', ') || 'No votes';
      inner.innerHTML = '<span style="color:#c8973a"><strong>'+getPlayerName(n.nominator)+'</strong> → <strong>'+getPlayerName(n.nominee)+'</strong></span><br><span style="color:#9a7d4a; font-size:11px;">Voted: '+voterNames+'</span>';
      wrapper.appendChild(inner);
    });
    c.appendChild(wrapper);
  });
}

// ==========================================
// MODULE 2: EMPATH ALIVE GEOMETRICS
// ==========================================
function addEmpathClaim() {
  var targetId = parseInt(document.getElementById('empath-player').value);
  var rawValue = parseInt(document.getElementById('empath-result').value);
  empathToday.push({ empathId: targetId, val: rawValue });
  renderEmpathToday();
}

function getAliveNeighbors(centerId) {
  var numPlayers = players.length;
  var leftNeighbor = null, rightNeighbor = null;
  var centerIndex = players.findIndex(function(p) { return p.id === centerId; });

  for(var i = 1; i < numPlayers; i++) {
    var checkIndex = (centerIndex - i + numPlayers) % numPlayers;
    if(players[checkIndex].alive) { leftNeighbor = players[checkIndex]; break; }
  }
  for(var i = 1; i < numPlayers; i++) {
    var checkIndex = (centerIndex + i) % numPlayers;
    if(players[checkIndex].alive) { rightNeighbor = players[checkIndex]; break; }
  }
  return { left: leftNeighbor, right: rightNeighbor };
}

function computeEmpathDeductionText(val) {
  if(vortoxMode) {
    if(val === 0) return "<span style='color:#f0a0a0'>At least one neighbor is evil</span>";
    if(val === 1) return "<span style='color:#f0a0a0'>Neighbors match (Both Good or Both Evil)</span>";
    if(val === 2) return "<span style='color:#f0a0a0'>At least one neighbor is good</span>";
  } else {
    if(val === 0) return "Both neighbors are Good";
    if(val === 1) return "Exactly 1 neighbor is Evil";
    if(val === 2) return "Both neighbors are Evil";
  }
  return "Unknown execution parameter";
}

function renderEmpathToday() {
  var container = document.getElementById('empath-today-list');
  if(!container) return;
  if(!empathToday.length) { container.innerHTML = '<div style="color:#5a3d18; text-align:center; padding:1rem">No Empath information recorded today.</div>'; return; }
  container.innerHTML = '';
  empathToday.forEach(function(e) {
    var neighbors = getAliveNeighbors(e.empathId);
    var leftName = neighbors.left ? neighbors.left.name : 'None';
    var rightName = neighbors.right ? neighbors.right.name : 'None';

    var div = document.createElement('div');
    div.className = 'ledger-item';
    div.innerHTML = '<strong>' + getPlayerName(e.empathId) + '</strong> claimed a token score of <strong>' + e.val + '</strong><br>' +
                    '<span style="color:#9a7d4a">Calculated Neighbors:</span> ' + leftName + ' & ' + rightName + '<br>' +
                    '💡 <span style="color:#c8973a">Logic:</span> ' + computeEmpathDeductionText(e.val);
    container.appendChild(div);
  });
}

function renderEmpathHistory() {
  var container = document.getElementById('empath-history-list');
  if(!container) return;
  if(!empathHistory.length) { hide('empath-history-card'); return; }
  show('empath-history-card');
  container.innerHTML = '';
  empathHistory.slice().reverse().forEach(function(h) {
    var wrapper = document.createElement('div');
    wrapper.className = 'day-history-container';
    wrapper.innerHTML = '<div class="day-history-title">Day ' + h.day + '</div>';
    h.items.forEach(function(e) {
      var neighbors = getAliveNeighbors(e.empathId);
      var leftName = neighbors.left ? neighbors.left.name : 'None';
      var rightName = neighbors.right ? neighbors.right.name : 'None';

      var inner = document.createElement('div');
      inner.style.marginBottom = '8px';
      inner.innerHTML = '<strong>' + getPlayerName(e.empathId) + '</strong> got a <strong>' + e.val + '</strong> ' +
                        '<span style="color:#9a7d4a">(' + leftName + ' & ' + rightName + ')</span><br>' +
                        '💡 <span style="color:#c8973a; font-size:12px">' + computeEmpathDeductionText(e.val) + '</span>';
      wrapper.appendChild(inner);
    });
    container.appendChild(wrapper);
  });
}

// ==========================================
// MODULE 3: GOSSIP PREDICTIONS
// ==========================================
function addGossipClaim() {
  var pid = parseInt(document.getElementById('gossip-player').value);
  var text = document.getElementById('gossip-text').value.trim();
  if(!text) return;

  gossipToday.push({ playerId: pid, statement: text, verification: 'unknown' });
  document.getElementById('gossip-text').value = '';
  renderGossipToday();
}

function renderGossipToday() {
  var container = document.getElementById('gossip-today-list');
  if(!container) return;
  if(!gossipToday.length) { container.innerHTML = '<div style="color:#5a3d18; text-align:center; padding:1rem">No gossips spoken today.</div>'; return; }
  container.innerHTML = gossipToday.map(function(g) {
    return '<div class="ledger-item"><strong>' + getPlayerName(g.playerId) + '</strong>: "' + g.statement + '"</div>';
  }).join('');
}

function renderGossipHistory() {
  var container = document.getElementById('gossip-history-list');
  if(!container) return;
  if(!gossipHistory.length) { hide('gossip-history-card'); return; }
  show('gossip-history-card');
  container.innerHTML = '';
  gossipHistory.slice().reverse().forEach(function(h) {
    var wrapper = document.createElement('div');
    wrapper.className = 'day-history-container';
    wrapper.innerHTML = '<div class="day-history-title">Day ' + h.day + '</div>';
    h.items.forEach(function(g) {
      var inner = document.createElement('div');
      inner.style.marginBottom = '8px';
      inner.innerHTML = '<strong>' + getPlayerName(g.playerId) + '</strong>: "' + g.statement + '"';
      wrapper.appendChild(inner);
    });
    container.appendChild(wrapper);
  });
}

// ==========================================
// MODULE 4: JUGGLER CLAIMS
// ==========================================
function addJugglerClaim() {
  var jugglerId = parseInt(document.getElementById('juggler-player').value);

  var guesses = [];
  for (var i = 1; i <= 5; i++) {
    var targetVal = document.getElementById('jug-p-' + i).value;
    var roleVal = document.getElementById('jug-r-' + i).value.trim();

    if (targetVal !== "" || roleVal !== "") {
      guesses.push({
        targetId: targetVal === "" ? null : parseInt(targetVal),
        role: roleVal || ""
      });
    }
  }

  jugglerToday.push({
    playerId: jugglerId,
    guesses: guesses
  });

  for (var j = 1; j <= 5; j++) {
    document.getElementById('jug-p-' + j).value = "";
    document.getElementById('jug-r-' + j).value = "";
  }

  renderJugglerToday();
}

function renderJugglerToday() {
  var container = document.getElementById('juggler-today-list');
  if(!container) return;

  if (!jugglerToday.length) {
    container.innerHTML = '<div style="color:#5a3d18; text-align:center; padding:1rem">No Juggler claims logged today.</div>';
    return;
  }

  container.innerHTML = '';
  jugglerToday.forEach(function(j) {
    var div = document.createElement('div');
    div.className = 'ledger-item';

    var guessText = j.guesses.length
      ? j.guesses.map(function(g, idx) {
          var targetName = g.targetId !== null ? getPlayerName(g.targetId) : '—';
          var roleName = g.role || '—';
          return (idx + 1) + '. ' + targetName + ' → ' + roleName;
        }).join('<br>')
      : '<span style="color:#9a7d4a">No guesses entered</span>';

    div.innerHTML =
      '<strong>' + getPlayerName(j.playerId) + '</strong> logged a juggling event<br>' +
      '<div style="margin-top:6px; color:#e8d5b0">' + guessText + '</div>';

    container.appendChild(div);
  });
}

function renderJugglerHistory() {
  var container = document.getElementById('juggler-history-list');
  if(!container) return;
  if (!jugglerHistory.length) {
    hide('juggler-history-card');
    return;
  }

  show('juggler-history-card');
  container.innerHTML = '';

  jugglerHistory.slice().reverse().forEach(function(h) {
    var wrapper = document.createElement('div');
    wrapper.className = 'day-history-container';
    wrapper.innerHTML = '<div class="day-history-title">Day ' + h.day + '</div>';

    h.items.forEach(function(j) {
      var inner = document.createElement('div');
      inner.style.marginBottom = '8px';

      var guessText = j.guesses.length
        ? j.guesses.map(function(g, idx) {
            var targetName = g.targetId !== null ? getPlayerName(g.targetId) : '—';
            var roleName = g.role || '—';
            return (idx + 1) + '. ' + targetName + ' → ' + roleName;
          }).join('<br>')
        : 'No guesses entered';

      inner.innerHTML =
        '<strong>' + getPlayerName(j.playerId) + '</strong><br>' +
        '<span style="color:#9a7d4a; font-size:12px">' + guessText + '</span>';

      wrapper.appendChild(inner);
    });

    container.appendChild(wrapper);
  });
}

// ==========================================
// MODULE 5: SAVANT MATRIX
// ==========================================
function renderSavantMatrix() {
  var container = document.getElementById('savant-matrix-container');
  if(!container) return;
  container.innerHTML = '<div style="color:#9a7d4a; font-size:13px; text-align:center; padding:1rem;">Savant grid UI not yet implemented.</div>';
}
