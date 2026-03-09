// 3D 바둑 게임
// Three.js를 사용한 3D 렌더링 + 완전한 바둑 규칙 구현

'use strict';

// ─── 바둑 게임 로직 ───────────────────────────────────────────────

const EMPTY = 0, BLACK = 1, WHITE = 2;

class GoGame {
  constructor(size = 19) {
    this.size = size;
    this.reset();
  }

  reset() {
    this.board = Array.from({ length: this.size }, () => new Array(this.size).fill(EMPTY));
    this.currentPlayer = BLACK;
    this.blackCaptures = 0;
    this.whiteCaptures = 0;
    this.koPoint = null; // {r, c} or null
    this.history = []; // for ko detection
    this.passCount = 0;
    this.gameOver = false;
    this.winner = null;
  }

  opponent(color) {
    return color === BLACK ? WHITE : BLACK;
  }

  inBounds(r, c) {
    return r >= 0 && r < this.size && c >= 0 && c < this.size;
  }

  neighbors(r, c) {
    return [[r-1,c],[r+1,c],[r,c-1],[r,c+1]].filter(([nr,nc]) => this.inBounds(nr, nc));
  }

  // BFS: get group and liberties
  getGroup(r, c) {
    const color = this.board[r][c];
    if (color === EMPTY) return null;
    const stones = [];
    const liberties = new Set();
    const visited = new Set();
    const queue = [[r, c]];
    visited.add(`${r},${c}`);
    while (queue.length) {
      const [cr, cc] = queue.shift();
      stones.push([cr, cc]);
      for (const [nr, nc] of this.neighbors(cr, cc)) {
        const key = `${nr},${nc}`;
        if (this.board[nr][nc] === EMPTY) {
          liberties.add(key);
        } else if (this.board[nr][nc] === color && !visited.has(key)) {
          visited.add(key);
          queue.push([nr, nc]);
        }
      }
    }
    return { stones, liberties };
  }

  // Try to place stone; returns { ok, captures, message }
  placeStone(r, c) {
    if (this.gameOver) return { ok: false, message: '게임이 끝났습니다.' };
    if (!this.inBounds(r, c)) return { ok: false, message: '범위 밖입니다.' };
    if (this.board[r][c] !== EMPTY) return { ok: false, message: '이미 돌이 놓여 있습니다.' };

    // Ko check
    if (this.koPoint && this.koPoint.r === r && this.koPoint.c === c) {
      return { ok: false, message: '패(ko) 규칙 위반입니다.' };
    }

    const color = this.currentPlayer;
    const oppColor = this.opponent(color);

    // Temporarily place stone
    this.board[r][c] = color;

    // Find opponent groups to capture
    let capturedStones = [];
    for (const [nr, nc] of this.neighbors(r, c)) {
      if (this.board[nr][nc] === oppColor) {
        const group = this.getGroup(nr, nc);
        if (group && group.liberties.size === 0) {
          capturedStones.push(...group.stones);
        }
      }
    }

    // Remove duplicates
    const capturedSet = new Set(capturedStones.map(([sr,sc]) => `${sr},${sc}`));
    capturedStones = [...capturedSet].map(k => k.split(',').map(Number));

    // Remove captured stones
    for (const [sr, sc] of capturedStones) {
      this.board[sr][sc] = EMPTY;
    }

    // Suicide check (no liberties after captures)
    const placedGroup = this.getGroup(r, c);
    if (placedGroup && placedGroup.liberties.size === 0) {
      // Undo
      this.board[r][c] = EMPTY;
      for (const [sr, sc] of capturedStones) {
        this.board[sr][sc] = oppColor;
      }
      return { ok: false, message: '자살수는 허용되지 않습니다.' };
    }

    // Update captures
    if (color === BLACK) {
      this.blackCaptures += capturedStones.length;
    } else {
      this.whiteCaptures += capturedStones.length;
    }

    // Ko detection: if exactly 1 stone captured and placed group has exactly 1 stone
    if (capturedStones.length === 1 && placedGroup.stones.length === 1) {
      this.koPoint = { r: capturedStones[0][0], c: capturedStones[0][1] };
    } else {
      this.koPoint = null;
    }

    this.passCount = 0;
    this.currentPlayer = oppColor;

    return { ok: true, captures: capturedStones };
  }

  pass() {
    if (this.gameOver) return { ok: false };
    this.passCount++;
    this.koPoint = null;
    if (this.passCount >= 2) {
      this.gameOver = true;
      this.scoreGame();
    }
    this.currentPlayer = this.opponent(this.currentPlayer);
    return { ok: true };
  }

  resign() {
    this.gameOver = true;
    this.winner = this.opponent(this.currentPlayer);
  }

  // Simple territory scoring (Chinese rules approximation)
  scoreGame() {
    const territory = Array.from({ length: this.size }, () => new Array(this.size).fill(0));
    const visited = Array.from({ length: this.size }, () => new Array(this.size).fill(false));

    let blackTerritory = 0, whiteTerritory = 0;

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.board[r][c] === EMPTY && !visited[r][c]) {
          // Flood fill empty region
          const region = [];
          const borders = new Set();
          const queue = [[r, c]];
          visited[r][c] = true;
          while (queue.length) {
            const [cr, cc] = queue.shift();
            region.push([cr, cc]);
            for (const [nr, nc] of this.neighbors(cr, cc)) {
              if (this.board[nr][nc] === EMPTY && !visited[nr][nc]) {
                visited[nr][nc] = true;
                queue.push([nr, nc]);
              } else if (this.board[nr][nc] !== EMPTY) {
                borders.add(this.board[nr][nc]);
              }
            }
          }
          if (borders.size === 1) {
            const owner = [...borders][0];
            if (owner === BLACK) blackTerritory += region.length;
            else whiteTerritory += region.length;
          }
        }
      }
    }

    // Count stones on board
    let blackStones = 0, whiteStones = 0;
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.board[r][c] === BLACK) blackStones++;
        else if (this.board[r][c] === WHITE) whiteStones++;
      }
    }

    const komi = 6.5;
    const blackScore = blackTerritory + blackStones + this.blackCaptures;
    const whiteScore = whiteTerritory + whiteStones + this.whiteCaptures + komi;

    this.finalBlackScore = blackScore;
    this.finalWhiteScore = whiteScore;
    this.winner = blackScore > whiteScore ? BLACK : WHITE;

    return { blackScore, whiteScore };
  }
}

// ─── 3D 렌더링 ────────────────────────────────────────────────────

class Go3D {
  constructor() {
    this.boardSize = 19;
    this.game = new GoGame(this.boardSize);
    this.stoneMeshes = new Map(); // key: "r,c" -> mesh
    this.hoverMesh = null;
    this.animationQueue = [];

    this.initThree();
    this.initBoard();
    this.initLights();
    this.initEvents();
    this.updateUI();
    this.animate();
  }

  initThree() {
    const canvas = document.getElementById('canvas');
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0x1a1a2e);
    this.resize();

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x1a1a2e, 0.018);

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 200);
    this.resetCamera();

    // Orbit controls (manual)
    this.orbitState = {
      isDragging: false,
      lastX: 0, lastY: 0,
      theta: Math.PI / 6,  // vertical angle
      phi: 0,              // horizontal angle
      radius: 28,
      target: new THREE.Vector3(0, 0, 0)
    };
  }

  resetCamera() {
    this.camera.position.set(0, 22, 18);
    this.camera.lookAt(0, 0, 0);
    if (this.orbitState) {
      this.orbitState.theta = Math.PI / 6;
      this.orbitState.phi = 0;
      this.orbitState.radius = 28;
    }
  }

  resize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    if (this.camera) {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    }
  }

  initLights() {
    // Ambient
    this.scene.add(new THREE.AmbientLight(0xffeedd, 0.4));

    // Main directional light (sun-like)
    const sun = new THREE.DirectionalLight(0xfff5e0, 1.2);
    sun.position.set(10, 20, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 100;
    sun.shadow.camera.left = -20;
    sun.shadow.camera.right = 20;
    sun.shadow.camera.top = 20;
    sun.shadow.camera.bottom = -20;
    this.scene.add(sun);

    // Fill light
    const fill = new THREE.DirectionalLight(0xaaccff, 0.4);
    fill.position.set(-8, 10, -5);
    this.scene.add(fill);

    // Point light above board
    const pointLight = new THREE.PointLight(0xfff0cc, 0.6, 40);
    pointLight.position.set(0, 15, 0);
    this.scene.add(pointLight);
  }

  get cellSize() {
    // Board spans from -(boardSize-1)/2 to +(boardSize-1)/2
    return 1.0;
  }

  boardPos(r, c) {
    const half = (this.boardSize - 1) / 2;
    return new THREE.Vector3((c - half) * this.cellSize, 0, (r - half) * this.cellSize);
  }

  initBoard() {
    // Clear existing board objects
    if (this.boardGroup) {
      this.scene.remove(this.boardGroup);
      this.stoneMeshes.clear();
    }
    this.boardGroup = new THREE.Group();
    this.scene.add(this.boardGroup);

    const n = this.boardSize;
    const half = (n - 1) / 2;
    const boardW = (n - 1) * this.cellSize;

    // ── Board surface (wood) ──────────────────────────────────────
    const boardGeo = new THREE.BoxGeometry(boardW + 1.4, 0.5, boardW + 1.4);
    const boardMat = new THREE.MeshStandardMaterial({
      color: 0xc8860a,
      roughness: 0.7,
      metalness: 0.05
    });
    const boardMesh = new THREE.Mesh(boardGeo, boardMat);
    boardMesh.position.set(0, -0.25, 0);
    boardMesh.receiveShadow = true;
    this.boardGroup.add(boardMesh);

    // ── Grid lines ────────────────────────────────────────────────
    const lineMat = new THREE.LineBasicMaterial({ color: 0x3a2000 });
    for (let i = 0; i < n; i++) {
      const x = (i - half) * this.cellSize;
      // Vertical line
      const vGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, 0.01, -boardW / 2),
        new THREE.Vector3(x, 0.01, boardW / 2)
      ]);
      this.boardGroup.add(new THREE.Line(vGeo, lineMat));
      // Horizontal line
      const hGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-boardW / 2, 0.01, x),
        new THREE.Vector3(boardW / 2, 0.01, x)
      ]);
      this.boardGroup.add(new THREE.Line(hGeo, lineMat));
    }

    // ── Star points (hoshi) ───────────────────────────────────────
    const starPositions = this.getStarPoints(n);
    const starGeo = new THREE.CircleGeometry(0.08, 12);
    const starMat = new THREE.MeshBasicMaterial({ color: 0x3a2000 });
    for (const [r, c] of starPositions) {
      const star = new THREE.Mesh(starGeo, starMat);
      const pos = this.boardPos(r, c);
      star.position.set(pos.x, 0.015, pos.z);
      star.rotation.x = -Math.PI / 2;
      this.boardGroup.add(star);
    }

    // ── Board border frame ────────────────────────────────────────
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x8b5a00, roughness: 0.9 });
    const frameH = 0.15;
    const frameW = 0.6;
    const outerHalf = boardW / 2 + 0.7;
    const frames = [
      { pos: [0, frameH/2, outerHalf], size: [boardW + 2*frameW, frameH, frameW] },
      { pos: [0, frameH/2, -outerHalf], size: [boardW + 2*frameW, frameH, frameW] },
      { pos: [outerHalf, frameH/2, 0], size: [frameW, frameH, boardW] },
      { pos: [-outerHalf, frameH/2, 0], size: [frameW, frameH, boardW] },
    ];
    for (const { pos, size } of frames) {
      const geo = new THREE.BoxGeometry(...size);
      const mesh = new THREE.Mesh(geo, frameMat);
      mesh.position.set(...pos);
      mesh.castShadow = true;
      this.boardGroup.add(mesh);
    }

    // ── Raycasting plane (invisible, for mouse picking) ───────────
    const pickGeo = new THREE.PlaneGeometry(boardW + 2, boardW + 2);
    const pickMat = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide });
    this.pickPlane = new THREE.Mesh(pickGeo, pickMat);
    this.pickPlane.rotation.x = -Math.PI / 2;
    this.pickPlane.position.y = 0.01;
    this.boardGroup.add(this.pickPlane);

    // Hover stone
    this.createHoverStone();
  }

  getStarPoints(n) {
    if (n === 19) {
      return [[3,3],[3,9],[3,15],[9,3],[9,9],[9,15],[15,3],[15,9],[15,15]];
    } else if (n === 13) {
      return [[3,3],[3,9],[9,3],[9,9],[6,6]];
    } else if (n === 9) {
      return [[2,2],[2,6],[6,2],[6,6],[4,4]];
    }
    return [];
  }

  createHoverStone() {
    if (this.hoverMesh) {
      this.boardGroup.remove(this.hoverMesh);
    }
    const geo = new THREE.SphereGeometry(0.42, 24, 24);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      transparent: true,
      opacity: 0.45,
      roughness: 0.3,
      metalness: 0.1
    });
    this.hoverMesh = new THREE.Mesh(geo, mat);
    this.hoverMesh.visible = false;
    this.hoverMesh.position.y = 0.42;
    this.boardGroup.add(this.hoverMesh);
    this.hoverColor = BLACK;
  }

  addStone(r, c, color) {
    const key = `${r},${c}`;
    if (this.stoneMeshes.has(key)) return;

    const isBlack = color === BLACK;
    const geo = new THREE.SphereGeometry(0.44, 28, 28);
    const mat = new THREE.MeshStandardMaterial({
      color: isBlack ? 0x111111 : 0xf5f5f5,
      roughness: isBlack ? 0.5 : 0.3,
      metalness: isBlack ? 0.15 : 0.05,
      envMapIntensity: 1.0,
    });

    const mesh = new THREE.Mesh(geo, mat);
    const pos = this.boardPos(r, c);
    mesh.position.set(pos.x, 2.0, pos.z); // drop from above
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.boardGroup.add(mesh);
    this.stoneMeshes.set(key, mesh);

    // Animate drop
    const targetY = 0.44;
    this.animationQueue.push({ mesh, targetY, vy: 0, done: false });
  }

  removeStone(r, c) {
    const key = `${r},${c}`;
    const mesh = this.stoneMeshes.get(key);
    if (mesh) {
      this.boardGroup.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
      this.stoneMeshes.delete(key);
    }
  }

  clearAllStones() {
    for (const [, mesh] of this.stoneMeshes) {
      this.boardGroup.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
    this.stoneMeshes.clear();
  }

  // Convert screen coordinates to board intersection
  screenToBoard(x, y) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndcX = ((x - rect.left) / rect.width) * 2 - 1;
    const ndcY = -((y - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera({ x: ndcX, y: ndcY }, this.camera);

    const hits = raycaster.intersectObject(this.pickPlane);
    if (!hits.length) return null;

    const pt = hits[0].point;
    const half = (this.boardSize - 1) / 2;
    const r = Math.round(pt.z / this.cellSize + half);
    const c = Math.round(pt.x / this.cellSize + half);

    if (r < 0 || r >= this.boardSize || c < 0 || c >= this.boardSize) return null;
    return { r, c };
  }

  initEvents() {
    const canvas = this.renderer.domElement;

    // Mouse events for orbit
    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.orbitState.isDragging = true;
        this.orbitState.lastX = e.clientX;
        this.orbitState.lastY = e.clientY;
        this.dragMoved = false;
      }
    });

    canvas.addEventListener('mousemove', (e) => {
      const state = this.orbitState;
      if (state.isDragging) {
        const dx = e.clientX - state.lastX;
        const dy = e.clientY - state.lastY;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) this.dragMoved = true;
        state.phi -= dx * 0.008;
        state.theta = Math.max(0.05, Math.min(Math.PI / 2 - 0.05, state.theta + dy * 0.006));
        state.lastX = e.clientX;
        state.lastY = e.clientY;
        this.updateCamera();
      }

      // Hover
      const bc = this.screenToBoard(e.clientX, e.clientY);
      this.updateHover(bc);
    });

    canvas.addEventListener('mouseup', (e) => {
      if (e.button === 0 && !this.dragMoved) {
        const bc = this.screenToBoard(e.clientX, e.clientY);
        if (bc) this.handleClick(bc.r, bc.c);
      }
      this.orbitState.isDragging = false;
    });

    canvas.addEventListener('mouseleave', () => {
      this.orbitState.isDragging = false;
      if (this.hoverMesh) this.hoverMesh.visible = false;
    });

    canvas.addEventListener('wheel', (e) => {
      this.orbitState.radius = Math.max(8, Math.min(50, this.orbitState.radius + e.deltaY * 0.04));
      this.updateCamera();
    }, { passive: true });

    // Touch support
    let lastTouchDist = 0;
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.orbitState.isDragging = true;
        this.orbitState.lastX = e.touches[0].clientX;
        this.orbitState.lastY = e.touches[0].clientY;
        this.dragMoved = false;
      } else if (e.touches.length === 2) {
        lastTouchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
      const state = this.orbitState;
      if (e.touches.length === 1 && state.isDragging) {
        const dx = e.touches[0].clientX - state.lastX;
        const dy = e.touches[0].clientY - state.lastY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) this.dragMoved = true;
        state.phi -= dx * 0.008;
        state.theta = Math.max(0.05, Math.min(Math.PI / 2 - 0.05, state.theta + dy * 0.006));
        state.lastX = e.touches[0].clientX;
        state.lastY = e.touches[0].clientY;
        this.updateCamera();
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        state.radius = Math.max(8, Math.min(50, state.radius - (dist - lastTouchDist) * 0.05));
        lastTouchDist = dist;
        this.updateCamera();
      }
    }, { passive: true });

    canvas.addEventListener('touchend', (e) => {
      if (!this.dragMoved && e.changedTouches.length === 1) {
        const t = e.changedTouches[0];
        const bc = this.screenToBoard(t.clientX, t.clientY);
        if (bc) this.handleClick(bc.r, bc.c);
      }
      this.orbitState.isDragging = false;
    });

    window.addEventListener('resize', () => this.resize());

    // UI buttons
    document.getElementById('btn-pass').addEventListener('click', () => this.handlePass());
    document.getElementById('btn-resign').addEventListener('click', () => this.handleResign());
    document.getElementById('btn-reset').addEventListener('click', () => this.handleReset());
    document.getElementById('board-size').addEventListener('change', (e) => {
      this.boardSize = parseInt(e.target.value);
      this.handleReset();
    });
  }

  updateCamera() {
    const { theta, phi, radius, target } = this.orbitState;
    this.camera.position.x = target.x + radius * Math.cos(theta) * Math.sin(phi);
    this.camera.position.y = target.y + radius * Math.sin(theta);
    this.camera.position.z = target.z + radius * Math.cos(theta) * Math.cos(phi);
    this.camera.lookAt(target);
  }

  updateHover(bc) {
    if (!this.hoverMesh || this.game.gameOver) {
      if (this.hoverMesh) this.hoverMesh.visible = false;
      return;
    }
    if (!bc || this.game.board[bc.r][bc.c] !== EMPTY) {
      this.hoverMesh.visible = false;
      return;
    }

    const pos = this.boardPos(bc.r, bc.c);
    this.hoverMesh.position.set(pos.x, 0.44, pos.z);

    const isBlack = this.game.currentPlayer === BLACK;
    this.hoverMesh.material.color.set(isBlack ? 0x222222 : 0xeeeeee);
    this.hoverMesh.material.opacity = 0.4;
    this.hoverMesh.visible = true;
  }

  handleClick(r, c) {
    const result = this.game.placeStone(r, c);
    if (!result.ok) {
      this.showMessage(result.message, 1200);
      return;
    }

    // Add stone visually
    const placedColor = this.game.opponent(this.game.currentPlayer); // current player already switched
    this.addStone(r, c, placedColor);

    // Remove captured stones
    if (result.captures) {
      for (const [cr, cc] of result.captures) {
        this.removeStone(cr, cc);
      }
      if (result.captures.length > 0) {
        this.showMessage(`${result.captures.length}개 따냄!`, 800);
      }
    }

    this.updateUI();
  }

  handlePass() {
    if (this.game.gameOver) return;
    const prevPlayer = this.game.currentPlayer;
    const result = this.game.pass();
    if (!result.ok) return;

    const playerName = prevPlayer === BLACK ? '흑' : '백';
    this.showMessage(`${playerName} 패스`, 1000);

    if (this.game.gameOver) {
      this.showGameOver();
    } else {
      this.updateUI();
    }
  }

  handleResign() {
    if (this.game.gameOver) return;
    this.game.resign();
    this.showGameOver();
  }

  handleReset() {
    this.hideMessage();
    this.game = new GoGame(this.boardSize);
    this.clearAllStones();
    this.initBoard();
    this.resetCamera();
    this.updateCamera();
    this.updateUI();
  }

  updateUI() {
    const isBlack = this.game.currentPlayer === BLACK;
    document.getElementById('turn-stone').className = `stone ${isBlack ? 'black' : 'white'}`;
    document.getElementById('turn-text').textContent = `${isBlack ? '흑' : '백'}의 차례`;
    document.getElementById('black-captures').textContent = this.game.blackCaptures;
    document.getElementById('white-captures').textContent = this.game.whiteCaptures;

    if (this.hoverMesh) {
      const mat = this.hoverMesh.material;
      mat.color.set(isBlack ? 0x222222 : 0xeeeeee);
    }
  }

  showGameOver() {
    const { winner, finalBlackScore, finalWhiteScore } = this.game;
    let msg;
    if (finalBlackScore !== undefined) {
      msg = `게임 종료!\n흑: ${finalBlackScore.toFixed(1)}점\n백: ${finalWhiteScore.toFixed(1)}점\n\n${winner === BLACK ? '흑 승!' : '백 승!'}`;
    } else {
      msg = `${winner === BLACK ? '흑' : '백'} 승! (기권)`;
    }
    this.showMessage(msg, 0);
    document.getElementById('turn-text').textContent = '게임 종료';
  }

  showMessage(text, duration) {
    const el = document.getElementById('message');
    el.textContent = text;
    el.classList.remove('hidden');
    if (duration > 0) {
      clearTimeout(this._msgTimer);
      this._msgTimer = setTimeout(() => el.classList.add('hidden'), duration);
    }
  }

  hideMessage() {
    document.getElementById('message').classList.add('hidden');
  }

  // Physics-based drop animation for stones
  tickAnimations() {
    const gravity = -0.025;
    const bounce = 0.35;
    const targetY = 0.44;

    this.animationQueue = this.animationQueue.filter(anim => {
      if (anim.done) return false;
      anim.vy += gravity;
      anim.mesh.position.y += anim.vy;
      if (anim.mesh.position.y <= targetY) {
        anim.mesh.position.y = targetY;
        anim.vy *= -bounce;
        if (Math.abs(anim.vy) < 0.01) {
          anim.done = true;
          return false;
        }
      }
      return true;
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.tickAnimations();
    this.renderer.render(this.scene, this.camera);
  }
}

// ─── 시작 ────────────────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', () => {
  // Initialize orbit camera position
  const go3d = new Go3D();
  go3d.updateCamera();
});
