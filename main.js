// Football Career Clicker Game Only
window.addEventListener('DOMContentLoaded', function() {
  console.log('JS loaded and running');
  let linkBar = document.getElementById('site-link-bar');
  console.log('linkBar:', linkBar);
  // --- NAVIGATION BAR: Home, Visit Website (new tab), Clear Cache ---
  if (!linkBar) {
    linkBar = document.createElement('div');
    linkBar.id = 'site-link-bar';
    linkBar.style.margin = '18px 0 0 0';
    linkBar.style.display = 'flex';
    linkBar.style.gap = '18px';
    linkBar.style.alignItems = 'center';
    linkBar.style.background = '#f5f5f5';
    linkBar.style.padding = '8px 16px';
    linkBar.style.borderBottom = '1px solid #ddd';
    linkBar.innerHTML = `
      <a href="/index.html" style="color:#2196f3;text-decoration:underline;font-weight:bold;">Home</a>
      <a href="/" style="color:#2196f3;text-decoration:underline;" target="_blank" rel="noopener">Visit Website</a>
      <button id="clear-cache-btn" style="margin-left:auto;background:#2196f3;color:#fff;border:none;padding:6px 14px;border-radius:4px;cursor:pointer;">Clear Cache & Reload</button>
    `;
    document.body.insertBefore(linkBar, document.body.firstChild);
  }
  // Always attach cache clearing logic (in case of hot reloads)
  const clearBtn = document.getElementById('clear-cache-btn');
  if (clearBtn) {
    clearBtn.onclick = async function() {
      try {
        localStorage.clear();
        sessionStorage.clear();
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
      } catch (e) { console.error('Cache clear error:', e); }
      location.reload();
    };
  }

  // Defensive: Only run clicker game JS if clicker HTML exists
  let careerContainer = document.getElementById('career-container');
  if (!careerContainer) {
    careerContainer = document.createElement('div');
    careerContainer.id = 'career-container';
    document.body.appendChild(careerContainer);
  }
  // Only declare playerSelectSection ONCE here and reuse below
  let playerSelectSection = document.getElementById('player-select-section');
  if (!playerSelectSection) {
    playerSelectSection = document.createElement('div');
    playerSelectSection.id = 'player-select-section';
    careerContainer.appendChild(playerSelectSection);
  }

  const clubLogo = document.getElementById('club-logo');
  const clubName = document.getElementById('club-name');
  const rollBtn = document.getElementById('roll-club');
  const clickerSection = document.getElementById('clicker-section');
  const goalCount = document.getElementById('goal-count');
  const scoreBtn = document.getElementById('score-btn');
  const transferSection = document.getElementById('transfer-section');
  const transferBtn = document.getElementById('transfer-btn');
  console.log('clubLogo:', clubLogo, 'clubName:', clubName, 'rollBtn:', rollBtn, 'clickerSection:', clickerSection, 'goalCount:', goalCount, 'scoreBtn:', scoreBtn, 'transferSection:', transferSection, 'transferBtn:', transferBtn);

  // --- FORCE UI VISIBLE FOR DEBUGGING ---
  if (clickerSection) clickerSection.style.display = 'none'; // Hide clicker section at start
  if (rollBtn) {
    rollBtn.style.display = 'inline-block';
    rollBtn.disabled = true; // Disable until player is chosen
  }
  if (playerSelectSection) playerSelectSection.style.display = 'block';

  const PLAYERS = [
    { name: 'Ronaldo', img: 'ron.jpg' },
    { name: 'Neymar', img: 'psgmar.webp' },
    { name: 'Messi', img: 'lionel.jpg' }
  ];

  let selectedPlayer = null;
  let currentClub = null;
  let goals = 0;
  let assists = 0;
  let goalsPerClick = 1;

  // Shop elements
  let shopSection = document.getElementById('shop-section');
  if (!shopSection) {
    shopSection = document.createElement('div');
    shopSection.id = 'shop-section';
    shopSection.style.marginTop = '24px';
    clickerSection.appendChild(shopSection);
  }

  const upgrades = [
    { label: 'Boot Upgrade: 1 click = 3 goals', cost: 50, value: 3 },
    { label: 'Pro Training: 1 click = 7 goals', cost: 200, value: 7 },
    { label: 'Legendary Coach: 1 click = 15 goals', cost: 600, value: 15 },
    { label: 'Superstar Status: 1 click = 30 goals', cost: 2000, value: 30 },
    { label: 'GOAT Mode: 1 click = 100 goals', cost: 10000, value: 100 }
  ];

  function renderShop() {
    shopSection.innerHTML = '<h3>Shop</h3>';
    upgrades.forEach((upg, i) => {
      if (goalsPerClick < upg.value) {
        const btn = document.createElement('button');
        btn.textContent = `${upg.label} (Cost: ${upg.cost} goals)`;
        btn.disabled = goals < upg.cost;
        btn.onclick = function() {
          if (goals >= upg.cost) {
            goals -= upg.cost;
            goalsPerClick = upg.value;
            updateGoals();
            renderShop();
          }
        };
        shopSection.appendChild(btn);
        shopSection.appendChild(document.createElement('br'));
      }
    });
  }

  function setClubLogoAndName(club) {
    clubLogo.onerror = function() {
      clubLogo.src = '';
      clubLogo.alt = 'Image not found';
      clubName.textContent = club.name + ' (image missing)';
    };
    clubLogo.src = club.logo;
    clubLogo.alt = club.name + ' Logo';
    clubName.textContent = club.name;
  }

  function rollForClub() {
    // Rolling animation: cycle through clubs for 1 second
    let rollDuration = 1000; // ms
    let interval = 70; // ms per frame
    let rollInterval = setInterval(() => {
      let idx = Math.floor(Math.random() * CLUBS.length);
      let tempClub = CLUBS[idx];
      setClubLogoAndName(tempClub);
    }, interval);
    setTimeout(() => {
      clearInterval(rollInterval);
      // Randomize club, but don't repeat current club
      let idx, newClub;
      do {
        idx = Math.floor(Math.random() * CLUBS.length);
        newClub = CLUBS[idx];
      } while (currentClub && newClub.name === currentClub.name && CLUBS.length > 1);
      currentClub = newClub;
      setClubLogoAndName(currentClub);
      clickerSection.style.display = 'block';
      rollBtn.style.display = 'none';
      goals = 0;
      assists = 0;
      goalsPerClick = 1;
      updateGoals();
      transferSection.style.display = 'none';
      renderShop();
    }, rollDuration);
  }

  function updateGoals() {
    goalCount.textContent = goals;
    // Calculate assists: 5 clicks = 1 assist
    assists = Math.floor(goals / 5);
    // Show transfer at 100+ goals
    if (goals >= 100) {
      transferSection.style.display = 'block';
      transferBtn.textContent = 'Move to New Club or Stay';
    } else {
      transferSection.style.display = 'none';
    }
    renderShop();
  }

  // Player selection UI
  // Always show player selection UI on the initial screen (index.html or root)
  if (playerSelectSection && (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname === '' || window.location.pathname.endsWith('/Project2/'))) {
    playerSelectSection.innerHTML = '<h2>Choose Your Player</h2>';
    // Use absolute paths for Codespaces/dev environments
    const playerImages = [
      { name: 'Ronaldo', img: '/players/ron.jpg' },
      { name: 'Neymar', img: '/players/psgmar.webp' },
      { name: 'Messi', img: '/players/lionel.jpg' }
    ];
    playerImages.forEach((p) => {
      const btn = document.createElement('button');
      btn.innerHTML = `<img src="${p.img}" alt="${p.name}" style="width:120px;height:120px;display:block;margin:auto;object-fit:cover;">` +
        `<div style=\"color:#fff;font-weight:bold;\">${p.name}</div>`;
      btn.onclick = function() {
        // Store player in localStorage and go to club roll screen
        localStorage.setItem('selectedPlayer', JSON.stringify(p));
        // Go to club-select.html for the next step (as before)
        window.location.href = 'club-select.html';
      };
      playerSelectSection.appendChild(btn);
    });
    playerSelectSection.style.marginBottom = '18px';
    playerSelectSection.style.display = 'block';
    // Hide main game UI until player is picked
    if (mainGameUI) mainGameUI.style.display = 'none';
  }

  // Show player info
  let playerChosen = document.getElementById('player-chosen');
  if (!playerChosen) {
    playerChosen = document.createElement('div');
    playerChosen.id = 'player-chosen';
    playerChosen.style.margin = '10px 0 10px 0';
    careerContainer.insertBefore(playerChosen, document.getElementById('club-section'));
  }
  // Hide roll button until player is chosen
  rollBtn.style.display = 'inline-block';
  rollBtn.disabled = true;

  // Fix: Ensure rollBtn event is set after DOM is ready and player is chosen
  function enableRollBtn() {
    rollBtn.style.display = 'inline-block';
    rollBtn.disabled = false;
  }

  rollBtn.onclick = function() {
    try {
      if (!selectedPlayer) {
        alert('Please select a player first!');
        return;
      }
      rollForClub();
    } catch (e) {
      alert('Error: ' + e.message);
      console.error(e);
    }
  };

  // Player selection UI logic for new HTML
  const mainGameUI = document.getElementById('main-game-ui');
  const playerChosenDiv = document.getElementById('player-chosen');
  const ronaldoBtn = document.getElementById('player-ronaldo');
  const neymarBtn = document.getElementById('player-neymar');
  const messiBtn = document.getElementById('player-messi');
  function handlePlayerSelect(player) {
    console.log('Player selected:', player.name);
    // Store player in localStorage for next page
    localStorage.setItem('selectedPlayer', JSON.stringify(player));
    window.location.href = 'club-select.html';
  }
  if (ronaldoBtn) ronaldoBtn.onclick = function() {
    handlePlayerSelect({ name: 'Ronaldo', img: 'ron.jpg' });
  };
  if (neymarBtn) neymarBtn.onclick = function() {
    handlePlayerSelect({ name: 'Neymar', img: 'psgmar.webp' });
  };
  if (messiBtn) messiBtn.onclick = function() {
    handlePlayerSelect({ name: 'Messi', img: 'lionel.jpg' });
  };
  // Initial UI state
  mainGameUI.style.display = 'none';
  playerSelectSection.style.display = 'block';
  rollBtn.style.display = 'inline-block';
  rollBtn.disabled = true;
  clickerSection.style.display = 'none';

  // Score button clicker logic
  scoreBtn.onclick = function() {
    goals += goalsPerClick;
    updateGoals();
  };

  // Transfer button logic
  transferBtn.onclick = function() {
    rollForClub();
  };

  // --- Dynamically load all club images from /teams folder ---
  async function getTeamImages() {
    // This will only work if you have a server endpoint or can list files. For static hosting, you must hardcode or update this list manually.
    // For Codespaces/Live Server, we can try to fetch a known list or use a static array.
    // If you add new images, update this array:
    return [
      'atleti.png', 'barcaa.png', 'benfica.png', 'castle.png', 'chelsea.png', 'citeh.png',
      'manu.svg', 'pool.png', 'psg.png', 'real_madrid.png', 'santios.png', 'sporting.png'
    ];
  }

  // Use all team images for club selection
  async function getClubs() {
    const teamImages = await getTeamImages();
    return teamImages.map(img => {
      const name = img.replace(/\.(png|webp|jpg|jpeg|svg)$/i, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      return { name, logo: '/teams/' + img };
    });
  }

  // --- Player selection UI always shown on /index.html or / ---
  async function showPlayerSelection() {
    playerSelectSection.innerHTML = '<h2><a href="/index.html" style="color:#2196f3;text-decoration:underline;cursor:pointer;">Football Career Clicker</a></h2>';
    const playerImages = [
      { name: 'Ronaldo', img: '/players/ron.jpg' },
      { name: 'Neymar', img: '/players/psgmar.webp' },
      { name: 'Messi', img: '/players/lionel.jpg' }
    ];
    playerImages.forEach((p) => {
      const btn = document.createElement('button');
      btn.innerHTML = `<img src="${p.img}" alt="${p.name}" style="width:120px;height:120px;display:block;margin:auto;object-fit:cover;">` +
        `<div style=\"color:#fff;font-weight:bold;\">${p.name}</div>`;
      btn.onclick = function() {
        // Store player in localStorage and go to club roll screen
        localStorage.setItem('selectedPlayer', JSON.stringify(p));
        // Go to club-select.html for the next step (as before)
        window.location.href = 'club-select.html';
      };
      playerSelectSection.appendChild(btn);
    });
    playerSelectSection.style.marginBottom = '18px';
    playerSelectSection.style.display = 'block';
    // Hide main game UI until player is picked
    if (mainGameUI) mainGameUI.style.display = 'none';
  }

  // On load, always show player selection if on /index.html or /
  if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname === '' || window.location.pathname.endsWith('/Project2/')) {
    showPlayerSelection();
  }

  // --- Club selection uses all team images ---
  let CLUBS = [];
  getClubs().then(clubs => { CLUBS = clubs; });

  // --- Robustly enforce header as a blue, underlined link to /index.html ---
  function enforceHeaderLink() {
    const header = document.querySelector('#career-container h2');
    if (header) {
      // Always replace with a link, regardless of content
      while (header.firstChild) header.removeChild(header.firstChild);
      const headerLink = document.createElement('a');
      headerLink.href = '/index.html';
      headerLink.textContent = 'Football Career Clicker';
      headerLink.style.color = '#2196f3';
      headerLink.style.textDecoration = 'underline';
      headerLink.style.cursor = 'pointer';
      header.appendChild(headerLink);
    }
  }
  enforceHeaderLink();
  // Observe DOM changes to #career-container and always enforce the header link
  const careerContainerObs = document.getElementById('career-container');
  if (careerContainerObs) {
    const observer = new MutationObserver(enforceHeaderLink);
    observer.observe(careerContainerObs, { childList: true, subtree: true });
  }

  // --- Intercept header link click to always show player selection UI and hide game UI ---
  document.addEventListener('DOMContentLoaded', function() {
    const headerLink = document.querySelector('#career-container h2 a');
    if (headerLink) {
      headerLink.addEventListener('click', function(e) {
        e.preventDefault();
        // Hide main game UI and show player selection UI
        const mainGameUI = document.getElementById('main-game-ui');
        const playerSelectSection = document.getElementById('player-select-section');
        if (mainGameUI) mainGameUI.style.display = 'none';
        if (playerSelectSection) {
          playerSelectSection.style.display = 'block';
          // Re-render player selection UI
          if (typeof showPlayerSelection === 'function') {
            showPlayerSelection();
          } else {
            // fallback: reload page if function missing
            window.location.href = '/index.html';
          }
        }
        // Optionally, clear any selected player
        localStorage.removeItem('selectedPlayer');
      });
    }
  });
});
