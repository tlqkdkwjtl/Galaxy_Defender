// 🎮 우주 슈팅 게임 
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ▶ 오디오 컨텍스트 초기화
let audioContext;
try {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
} catch (e) {
  console.log("Web Audio API를 지원하지 않는 브라우저입니다.");
}

// ▶ 사운드 효과 함수들
function playSound(frequency, duration, type = 'sine', volume = 0.3) {
  if (!audioContext) return;
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = frequency;
  oscillator.type = type;
  
  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

// ▶ 총알 발사 소리
function playShootSound() {
  playSound(800, 0.1, 'square', 0.2);
}

// ▶ 적 처치 소리 (폭발)
function playExplosionSound() {
  playSound(200, 0.2, 'sawtooth', 0.3);
  setTimeout(() => playSound(150, 0.15, 'sawtooth', 0.2), 50);
}

// ▶ 아이템 획득 소리
function playItemSound() {
  playSound(600, 0.15, 'sine', 0.25);
  setTimeout(() => playSound(800, 0.1, 'sine', 0.2), 50);
}

// ▶ 피격 소리
function playHitSound() {
  playSound(300, 0.2, 'square', 0.3);
}

// ▶ 게임 오버 소리
function playGameOverSound() {
  playSound(200, 0.3, 'sawtooth', 0.4);
  setTimeout(() => playSound(150, 0.3, 'sawtooth', 0.3), 100);
  setTimeout(() => playSound(100, 0.3, 'sawtooth', 0.3), 200);
}

// ▶ 전투기 이미지 로드
const playerImage = new Image();
playerImage.src = "images/fighter.png"; // 플레이어 전투기 이미지

// ▶ 외계인 적 이미지 로드  
const alienImage = new Image();
alienImage.src = "images/ufo.png"; // 외계인 적 이미지 경로 

// ▶ 로비 이미지 로드
const lobbyImage = new Image();
lobbyImage.src = "images/lobby.png";

// ▶ 로고 이미지 로드
const logoImage = new Image();
logoImage.src = "images/Create a logo .png";

// ▶ 버튼 이미지 로드
const sallyImage = new Image();
sallyImage.src = "images/sally.png";
const sortieLightImage = new Image();
sortieLightImage.src = "images/sortie, light.png";
const menuImage = new Image();
menuImage.src = "images/menu.png";
const menuLightImage = new Image();
menuLightImage.src = "images/Menu, Light.png";
const loungeImage = new Image();
loungeImage.src = "images/lounge.png";

// ▶ 플레이어 설정 
const player = {
  x: 180,
  y: 550,
  width: 40,
  height: 40,
  speed: 5,
};

// ▶ 상태 변수
let bullets = [];
let enemies = [];
let enemyBullets = [];  // 1️⃣ 적 총알
let items = [];    // 3️⃣ 아이템
let effects = [];  // 2️⃣ 폭발 이펙트
let score = 0;
let shield = 100;  // 실드 게이지 (0-100)
let gameState = "lobby"; // "lobby", "tutorial", "lounge", "playing", "gameOver"
let isFirstGame = true;  // 첫 게임 여부
let keys = {};
let mouseX = 0;
let mouseY = 0;
let isMouseDown = false;

// ▶ 총알 발사 시스템
let shotsFired = 0;  // 발사 횟수
let maxShots = 5;    // 최대 발사 횟수
let isOnCooldown = false;  // 쿨타임 중 여부
let cooldownTime = 200;  // 쿨타임 시간 (0.2초)
let cooldownStartTime = 0;  // 쿨타임 시작 시간

// ▶ 게임 통계
let gameStats = {
  deathCount: 0,
  enemiesKilled: 0,
  totalScore: 0,
  gamesPlayed: 0
};

// ▶ 버튼 영역 정의
const sortieButton = {
  x: 250,  // 우측 하단 (canvas width 400 기준)
  y: 450,
  width: 120,
  height: 70,
  hovered: false
};

const menuButton = {
  x: 250,  // sortie 버튼 아래 (겹치지 않도록 조정)
  y: 520,  // sortieButton 끝 위치(520)에서 시작
  width: 120,
  height: 70,
  hovered: false
};

// ▶ 별 배경 (움직이는 우주 느낌)
const stars = Array.from({ length: 50 }, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  size: Math.random() * 2 + 1,
  speed: Math.random() * 1 + 0.5
}));

// ▶ 키 입력 처리
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

// ▶ 마우스 입력 처리
canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
  
  // 버튼 호버 체크
  if (gameState === "lobby") {
    sortieButton.hovered = mouseX >= sortieButton.x && mouseX <= sortieButton.x + sortieButton.width &&
                          mouseY >= sortieButton.y && mouseY <= sortieButton.y + sortieButton.height;
    menuButton.hovered = mouseX >= menuButton.x && mouseX <= menuButton.x + menuButton.width &&
                        mouseY >= menuButton.y && mouseY <= menuButton.y + menuButton.height;
    
    // 커서 스타일 변경
    if (sortieButton.hovered || menuButton.hovered) {
      canvas.style.cursor = "pointer";
    } else {
      canvas.style.cursor = "default";
    }
  } else if (gameState === "lounge") {
    canvas.style.cursor = "pointer";
  } else {
    canvas.style.cursor = "default";
  }
});

canvas.addEventListener("mousedown", (e) => {
  isMouseDown = true;
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
  
  if (gameState === "lobby") {
    // Sortie 버튼 클릭 (먼저 체크하여 우선순위 부여)
    if (mouseX >= sortieButton.x && mouseX <= sortieButton.x + sortieButton.width &&
        mouseY >= sortieButton.y && mouseY < sortieButton.y + sortieButton.height) {
      startGame();
    }
    // Menu 버튼 클릭 (Sortie 버튼 영역이 아닐 때만)
    else if (mouseX >= menuButton.x && mouseX <= menuButton.x + menuButton.width &&
        mouseY >= menuButton.y && mouseY < menuButton.y + menuButton.height) {
      gameState = "lounge";
    }
  } else if (gameState === "tutorial") {
    // 설명 화면에서 클릭하면 게임 시작
    startGamePlay();
  } else if (gameState === "lounge") {
    // 라운지에서 로비로 돌아가기 (화면 어디든 클릭)
    gameState = "lobby";
  }
});

canvas.addEventListener("mouseup", () => {
  isMouseDown = false;
});

// ▶ 플레이어 총알 발사
function shoot() {
  // 쿨타임 중이면 발사 불가
  if (isOnCooldown) return;
  
  // 총알 발사
  bullets.push({
    x: player.x + player.width / 2 - 2,
    y: player.y,
    width: 4,
    height: 10,
    speed: 7
  });
  
  // 발사 소리
  playShootSound();
  
  shotsFired++;
  
  // 5번 발사하면 쿨타임 시작
  if (shotsFired >= maxShots) {
    isOnCooldown = true;
    cooldownStartTime = Date.now();
    shotsFired = 0;  // 발사 횟수 초기화
  }
}

// ▶ 쿨타임 체크
function checkCooldown() {
  if (isOnCooldown) {
    const elapsed = Date.now() - cooldownStartTime;
    if (elapsed >= cooldownTime) {
      isOnCooldown = false;
    }
  }
}

// ▶ 적 생성
function spawnEnemy() {
  const x = Math.random() * (canvas.width - 40); // 너비 고려
  enemies.push({ x: x, y: 0, width: 40, height: 40, speed: 2 });
}


// ▶ 적 총알 발사
function enemyShoot() {
  if (enemies.length === 0) return;
  const shooter = enemies[Math.floor(Math.random() * enemies.length)];
  enemyBullets.push({
    x: shooter.x + shooter.width / 2 - 2,
    y: shooter.y + shooter.height,
    width: 4,
    height: 10,
    speed: 4
  });
}


// ▶ 충돌 판정
function isColliding(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}


// ▶ 폭발 이펙트 생성
function spawnEffect(x, y) {
  for (let i = 0; i < 10; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2 + 1;
    effects.push({
      x,
      y,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      radius: 2 + Math.random() * 3,
      life: 30,
      color: `hsl(${Math.random() * 360}, 100%, 60%)`
    });
  }
}



// ▶ 아이템 생성
function spawnItem(x, y) {
  items.push({
    x,
    y,
    width: 12,
    height: 12,
    speed: 2
  });
}


// ▶ 별 배경 업데이트
function updateStars() {
  for (let s of stars) {
    s.y += s.speed;
    if (s.y > canvas.height) {
      s.y = 0;
      s.x = Math.random() * canvas.width;
    }
  }
}


// ▶ 이펙트 업데이트
function updateEffects() {
  effects.forEach(e => {
    e.x += e.dx;
    e.y += e.dy;
    e.life--;
  });
  effects = effects.filter(e => e.life > 0);
}



// ▶ 아이템 업데이트
function updateItems() {
  items.forEach(item => {
    item.y += item.speed;
    if (isColliding(item, player)) {
      score += 10;
      // 실드 게이지 5% 회복 (최대 100%)
      shield += 5;
      if (shield > 100) shield = 100;
      item.collected = true;
      // 아이템 획득 소리
      playItemSound();
    }
  });
  items = items.filter(i => i.y < canvas.height && !i.collected);
}


// ▶ 배경 별 그리기
function drawStars() {
  ctx.fillStyle = "#6f879eff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "white";
  for (let s of stars) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  }
}


// ▶ 이펙트 그리기
function drawEffects() {
  for (let e of effects) {
    const alpha = e.life / 30;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}



// ⭐ 별 모양 아이템 그리기 함수
function drawStarShape(x, y, radius, points, inset) {
  ctx.save();
  ctx.beginPath();
  ctx.translate(x, y);
  ctx.moveTo(0, 0 - radius);
  for (let i = 0; i < points; i++) {
    ctx.rotate(Math.PI / points);
    ctx.lineTo(0, 0 - (radius * inset));
    ctx.rotate(Math.PI / points);
    ctx.lineTo(0, 0 - radius);
  }
  ctx.closePath();
  ctx.restore();
}

// ⭐ 아이템 그리기
function drawItems() {
  ctx.fillStyle = "orange";
  for (let item of items) {
    ctx.beginPath();
    drawStarShape(item.x + item.width / 2, item.y + item.height / 2, 6, 5, 0.5);
    ctx.fill();
  }
}


// ▶ 로비 화면 그리기
function drawLobby() {
  // 로비 이미지 그리기
  if (lobbyImage.complete) {
    ctx.drawImage(lobbyImage, 0, 0, canvas.width, canvas.height);
  } else {
    // 이미지가 아직 로드되지 않은 경우 배경만 표시
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Galaxy Defender", canvas.width / 2, canvas.height / 2);
  }
  
  // 로고 이미지 중앙에 표시 (투명도 처리)
  if (logoImage.complete && logoImage.naturalWidth > 0) {
    const logoWidth = 250;  // 로고 너비
    const logoHeight = 150; // 로고 높이 (비율에 맞게 조정 가능)
    const logoX = (canvas.width - logoWidth) / 2;  // 중앙 정렬
    const logoY = 20; // 더 위쪽으로 이동
    
    // 투명도가 제대로 처리되도록 설정
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1.0;
    ctx.drawImage(logoImage, logoX, logoY, logoWidth, logoHeight);
    ctx.restore();
  }
  
  // Sortie 버튼 (sally.png / sortie, light.png)
  if (sortieButton.hovered && sortieLightImage.complete) {
    ctx.drawImage(sortieLightImage, sortieButton.x, sortieButton.y, sortieButton.width, sortieButton.height);
  } else if (sallyImage.complete) {
    ctx.drawImage(sallyImage, sortieButton.x, sortieButton.y, sortieButton.width, sortieButton.height);
  }
  
  // Menu 버튼 (menu.png / Menu, Light.png)
  if (menuButton.hovered && menuLightImage.complete) {
    ctx.drawImage(menuLightImage, menuButton.x, menuButton.y, menuButton.width, menuButton.height);
  } else if (menuImage.complete) {
    ctx.drawImage(menuImage, menuButton.x, menuButton.y, menuButton.width, menuButton.height);
  }
}

// ▶ 라운지 화면 그리기
function drawLounge() {
  // 라운지 배경 이미지
  if (loungeImage.complete) {
    ctx.drawImage(loungeImage, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  
  // 통계 표시
  ctx.fillStyle = "white";
  ctx.font = "bold 24px Arial";
  ctx.textAlign = "center";
  ctx.fillText("게임 통계", canvas.width / 2, 50);
  
  ctx.font = "18px Arial";
  ctx.textAlign = "left";
  const startY = 100;
  const lineHeight = 40;
  
  ctx.fillText(`충돌 횟수: ${gameStats.deathCount}`, 50, startY);
  ctx.fillText(`적 처치 수: ${gameStats.enemiesKilled}`, 50, startY + lineHeight);
  ctx.fillText(`총 점수: ${gameStats.totalScore}`, 50, startY + lineHeight * 2);
  ctx.fillText(`플레이 횟수: ${gameStats.gamesPlayed}`, 50, startY + lineHeight * 3);
  
  // 로비로 돌아가기 안내
  ctx.fillStyle = "yellow";
  ctx.font = "16px Arial";
  ctx.textAlign = "center";
  ctx.fillText("화면을 클릭하여 로비로 돌아가기", canvas.width / 2, canvas.height - 30);
}

// ▶ 게임 설명 화면 그리기
function drawTutorial() {
  // lobby.png 배경
  if (lobbyImage.complete) {
    ctx.drawImage(lobbyImage, 0, 0, canvas.width, canvas.height);
  } else {
    // 이미지가 아직 로드되지 않은 경우 검은 배경
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  
  // 텍스트 가독성을 위한 반투명 오버레이
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 제목
  ctx.fillStyle = "white";
  ctx.font = "bold 28px Arial";
  ctx.textAlign = "center";
  ctx.fillText("게임 설명", canvas.width / 2, 60);
  
  // 설명 내용
  ctx.font = "18px Arial";
  ctx.textAlign = "left";
  const startY = 120;
  const lineHeight = 35;
  const leftMargin = 40;
  
  ctx.fillText("【 조작 방법 】", leftMargin, startY);
  ctx.fillText("← → (또는 A, D): 좌우 이동", leftMargin + 20, startY + lineHeight);
  ctx.fillText("스페이스바: 총알 발사", leftMargin + 20, startY + lineHeight * 2);
  
  ctx.fillText("【 게임 규칙 】", leftMargin, startY + lineHeight * 3.5);
  ctx.fillText("• 적을 처치하면 별 아이템이 나옵니다", leftMargin + 20, startY + lineHeight * 4.5);
  ctx.fillText("• 별 아이템을 먹으면 실드가 5% 회복됩니다", leftMargin + 20, startY + lineHeight * 5.5);
  ctx.fillText("• 적 총알에 맞으면 실드 10% 감소", leftMargin + 20, startY + lineHeight * 6.5);
  ctx.fillText("• 적과 충돌하면 실드 5% 감소", leftMargin + 20, startY + lineHeight * 7.5);
  ctx.fillText("• 실드가 10% 이하가 되면 게임 종료", leftMargin + 20, startY + lineHeight * 8.5);
  
  // 시작 안내
  ctx.fillStyle = "yellow";
  ctx.font = "bold 20px Arial";
  ctx.textAlign = "center";
  ctx.fillText("스페이스바를 눌러 게임 시작", canvas.width / 2, canvas.height - 40);
}

// ▶ 메인 게임 루프
function update() {
  // 로비 화면
  if (gameState === "lobby") {
    drawLobby();
    requestAnimationFrame(update);
    return;
  }
  
  // 설명 화면
  if (gameState === "tutorial") {
    drawTutorial();
    // 스페이스바나 클릭으로 게임 시작
    if (keys[" "] || keys["Enter"]) {
      startGamePlay();
    }
    requestAnimationFrame(update);
    return;
  }
  
  // 라운지 화면
  if (gameState === "lounge") {
    drawLounge();
    requestAnimationFrame(update);
    return;
  }

  // 게임 오버 상태
  if (gameState === "gameOver") {
    return;
  }

  updateStars();
  updateEffects();
  updateItems();    // 3️⃣ 아이템
  
  // 쿨타임 체크
  checkCooldown();

  // 플레이어 이동
  if ((keys["ArrowLeft"] || keys["a"]) && player.x > 0) player.x -= player.speed;
  if ((keys["ArrowRight"] || keys["d"]) && player.x + player.width < canvas.width) player.x += player.speed;
  if (keys[" "]) shoot();

  // 총알 이동
  bullets.forEach(b => b.y -= b.speed);
  bullets = bullets.filter(b => b.y > 0);

  // 적 이동 및 충돌 처리
  enemies.forEach(e => {
    e.y += e.speed;
    if (isColliding(e, player)) {
      shield -= 5;  // 적과 충돌 시 5% 감소
      if (shield < 0) shield = 0;
      spawnEffect(e.x + e.width / 2, e.y + e.height / 2);
      e.hit = true;  // 충돌 표시
      // 피격 소리
      playHitSound();
      
      // 실드가 10% 이하가 되면 게임 종료
      if (shield <= 10) {
        gameState = "gameOver";
        gameStats.deathCount++;
        gameStats.totalScore += score;
        playGameOverSound();
        alert("더이상의 전투는 무리다 후퇴한다\nScore: " + score);
        resetToLobby();
        return;
      }
    }
  });
  
  // 충돌한 적 제거
  enemies = enemies.filter(e => !e.hit && e.y < canvas.height);

  // 플레이어 총알과 적 충돌 처리
  enemies = enemies.filter(e => {
    for (let b of bullets) {
      if (isColliding(e, b)) {
        score++;
        gameStats.enemiesKilled++;
        bullets = bullets.filter(bullet => bullet !== b);
        spawnEffect(e.x + e.width / 2, e.y + e.height / 2);
        // 적 처치 소리
        playExplosionSound();

        if (Math.random() < 0.3) {  // 3️⃣ 아이템
          spawnItem(e.x + e.width / 2 - 6, e.y);
        }

        return false;
      }
    }
    return e.y < canvas.height;
  });


  // 적 총알 이동 및 충돌
  enemyBullets.forEach(b => {
    b.y += b.speed;
    if (isColliding(b, player)) {
      shield -= 10;  // 적 총알 맞을 시 10% 감소
      if (shield < 0) shield = 0;
      b.hit = true;  // 충돌 표시
      spawnEffect(player.x + player.width / 2, player.y + player.height / 2);
      // 피격 소리
      playHitSound();
      
      // 실드가 10% 이하가 되면 게임 종료
      if (shield <= 10) {
        gameState = "gameOver";
        gameStats.deathCount++;
        gameStats.totalScore += score;
        playGameOverSound();
        alert("더이상의 전투는 무리다 후퇴한다\nScore: " + score);
        resetToLobby();
        return;
      }
    }
  });
  
  // 충돌한 총알 제거 및 화면 밖 총알 제거
  enemyBullets = enemyBullets.filter(b => !b.hit && b.y < canvas.height);


  // ▶ 그리기
  drawStars();       // 배경
  drawEffects();     // 2️⃣ 이펙트 폭발 효과
  drawItems();       // 3️⃣ 아이템

  // ▶ 적  
  enemies.forEach(e => {
    ctx.drawImage(alienImage, e.x, e.y, e.width, e.height);
  });

  // ▶ 플레이어 총알
  bullets.forEach(b => {
    ctx.fillStyle = "yellow";
    ctx.fillRect(b.x, b.y, b.width, b.height);
  });


  // ▶ 적 총알
  enemyBullets.forEach(b => {
    ctx.fillStyle = "black";
    ctx.fillRect(b.x, b.y, b.width, b.height);
  });


  // ▶ 플레이어
  ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);

  // ▶ 점수 표시
  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.fillText("Score: " + score, 10, 20);
  
  // ▶ 실드 표시 (오른쪽 위) - 강조
  ctx.save();
  // 배경 박스 그리기
  const shieldText = `실드 ${Math.max(0, Math.round(shield))}%`;
  ctx.font = "bold 20px Arial";
  ctx.textAlign = "right";
  const textWidth = ctx.measureText(shieldText).width;
  const padding = 6;  // 패딩 줄임
  const boxX = canvas.width - 10;
  const boxY = 5;
  const boxWidth = textWidth + padding * 2;
  const boxHeight = 30;
  
  // 반투명 검은 배경 (왼쪽 여백 줄이기)
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(boxX - boxWidth - 2, boxY, boxWidth + 2, boxHeight);
  
  // 실드 값에 따라 색상 변경
  let shieldColor;
  let shouldBlink = false;
  
  if (shield > 80) {
    shieldColor = "#0080ff";  // 파란색
  } else if (shield > 60) {
    shieldColor = "#00ff00";  // 초록색
  } else if (shield > 40) {
    shieldColor = "#ffff00";  // 노란색
  } else if (shield >= 30) {
    shieldColor = "#ff0000";  // 빨간색
  } else {
    shieldColor = "#ff0000";  // 빨간색
    shouldBlink = true;  // 20% 이하일 때 깜빡임
  }
  
  // 깜빡임 효과 (20% 이하일 때)
  if (shouldBlink && shield <= 20) {
    const blinkSpeed = 500;  // 깜빡임 속도 (밀리초)
    const time = Date.now();
    const blink = Math.floor(time / blinkSpeed) % 2;
    if (blink === 0) {
      ctx.globalAlpha = 0.3;  // 반투명
    } else {
      ctx.globalAlpha = 1.0;  // 불투명
    }
  } else {
    ctx.globalAlpha = 1.0;
  }
  
  ctx.fillStyle = shieldColor;
  ctx.fillText(shieldText, boxX, boxY + 22);
  ctx.restore();
  ctx.textAlign = "left";  // 기본 정렬로 복원

  requestAnimationFrame(update);
}

// ▶ 적 생성 및 총알 발사 주기 설정 (게임이 시작될 때만 작동)
let enemySpawnInterval;
let enemyShootInterval;

function startEnemySpawning() {
  enemySpawnInterval = setInterval(() => {
    if (gameState === "playing") {
      spawnEnemy();
    }
  }, 1000);
  
  enemyShootInterval = setInterval(() => {
    if (gameState === "playing") {
      enemyShoot();
    }
  }, 1500);
}

// 게임 시작 시 적 생성 시작
function startGame() {
  if (gameState === "lobby") {
    // 첫 게임이면 설명 화면으로
    if (isFirstGame) {
      gameState = "tutorial";
      isFirstGame = false;
    } else {
      // 바로 게임 시작
      startGamePlay();
    }
  }
}

// 실제 게임 시작
function startGamePlay() {
  // 기존 인터벌이 있으면 먼저 정리
  if (enemySpawnInterval) {
    clearInterval(enemySpawnInterval);
    enemySpawnInterval = null;
  }
  if (enemyShootInterval) {
    clearInterval(enemyShootInterval);
    enemyShootInterval = null;
  }
  
  // 게임 상태 초기화
  gameState = "playing";
  gameStats.gamesPlayed++;
  score = 0;
  shield = 100;  // 실드 초기화
  shotsFired = 0;  // 발사 횟수 초기화
  isOnCooldown = false;  // 쿨타임 상태 초기화
  bullets = [];
  enemies = [];
  enemyBullets = [];
  items = [];
  effects = [];
  player.x = 180;
  player.y = 550;
  keys = {};  // 키 입력 초기화
  
  // 적 생성 시작
  startEnemySpawning();
}

// 로비로 돌아가기
function resetToLobby() {
  // 적 생성 인터벌 정리
  if (enemySpawnInterval) {
    clearInterval(enemySpawnInterval);
    enemySpawnInterval = null;
  }
  if (enemyShootInterval) {
    clearInterval(enemyShootInterval);
    enemyShootInterval = null;
  }
  
  gameState = "lobby";
  score = 0;
  shield = 100;
  shotsFired = 0;
  isOnCooldown = false;
  bullets = [];
  enemies = [];
  enemyBullets = [];
  items = [];
  effects = [];
  player.x = 180;
  player.y = 550;
  keys = {};  // 키 입력 초기화
}

// ▶ 게임 시작 (로비 화면부터 시작)
update();
