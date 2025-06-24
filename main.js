// Football Career Clicker Game Only
window.addEventListener('DOMContentLoaded', function() {
  alert('JS loaded!');
  console.log('JS loaded and running');
  let linkBar = document.getElementById('site-link-bar');
  console.log('linkBar:', linkBar);
  if (!linkBar) {
    linkBar = document.createElement('div');
    linkBar.id = 'site-link-bar';
    linkBar.style.margin = '18px 0 0 0';
    linkBar.innerHTML = '<a href="http://localhost:5500/" target="_blank">Open Football Clicker Game</a>';
    document.body.insertBefore(linkBar, document.body.firstChild);
  }

  // Defensive: Only run clicker game JS if clicker HTML exists
  const careerContainer = document.getElementById('career-container');
  console.log('careerContainer:', careerContainer);
  if (!careerContainer) return;

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
  let playerSelectSection = document.getElementById('player-select-section');
  if (playerSelectSection) playerSelectSection.style.display = 'block';

  const CLUBS = [
    { name: 'Atleti', logo: 'atleti.png' },
    { name: 'Barcaa', logo: 'barcaa.png' },
    { name: 'Benfica', logo: 'benfica.png' },
    { name: 'Castle', logo: 'castle.png' },
    { name: 'Chelsea', logo: 'chelsea.png' },
    { name: 'Citeh', logo: 'citeh.png' },
    { name: 'PSG', logo: 'psg.png' },
    { name: 'Pool', logo: 'pool.png' },
    { name: 'Real Madrid', logo: 'real_madrid.png' }, // changed from 'real madrid.png'
    { name: 'Santios', logo: 'santios.png' },
    { name: 'Sporting', logo: 'sporting.png' }
  ];

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
  let playerSelectSection = document.getElementById('player-select-section');
  if (playerSelectSection) {
    playerSelectSection.innerHTML = '<h2>Choose Your Player</h2>';
    PLAYERS.forEach((p, i) => {
      const btn = document.createElement('button');
      btn.innerHTML = `<img src="${p.img}" alt="${p.name}" style="width:48px;height:48px;border-radius:50%;vertical-align:middle;margin-right:8px;">${p.name}`;
      btn.onclick = function() {
        selectedPlayer = p;
        playerSelectSection.style.display = 'none';
        rollBtn.style.display = 'inline-block';
        rollBtn.disabled = false;
        document.getElementById('player-chosen').innerHTML = `Player: <img src="${p.img}" style="width:32px;height:32px;border-radius:50%;vertical-align:middle;"> <b>${p.name}</b>`;
      };
      playerSelectSection.appendChild(btn);
    });
    playerSelectSection.style.marginBottom = '18px';
    playerSelectSection.style.display = 'block';
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
});
// ...end of file...
