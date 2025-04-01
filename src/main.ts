import * as THREE from 'three';

// MIDI設定
let selectedPort: string | null = null;  // nullで任意のポート（すべてのポート）
let selectedChannel: number | null = null;  // nullで任意のチャンネル（全チャンネル）

// 特定のポートを指定する場合
// selectedPort = "ポート名をここに記入";

// 特定のチャンネルを指定する場合 (チャンネルは0-15)
// selectedChannel = 0; // MIDI Channel 1を指定する場合

// Three.js初期設定
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// キューブ作成
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshNormalMaterial();
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// MIDI初期設定
navigator.requestMIDIAccess().then(midiAccess => {
  midiAccess.inputs.forEach(input => {
    console.log(`MIDIデバイス検出: ${input.name}`);
    input.onmidimessage = handleMIDIMessage;
  });

  midiAccess.onstatechange = (event) => {
    console.log(`MIDIデバイス状態変化: ${event.port.name}, 状態: ${event.port.state}`);
  };
}).catch(err => console.error('MIDI初期化失敗:', err));

// MIDIメッセージ処理
function handleMIDIMessage(event: WebMidi.MIDIMessageEvent) {
  const [status, noteNumber, velocity] = event.data;
  const command = status & 0xf0;
  const channel = status & 0x0f;

  // ポートとチャンネル指定がある場合はフィルタリング
  if (selectedPort && event.target.name !== selectedPort) return;
  if (selectedChannel !== null && channel !== selectedChannel) return;

  const noteInfo = `Port: ${event.target.name}, Channel: ${channel + 1}, Note: ${noteNumber}`;

  if (command === 0x90 && velocity > 0) {
    console.log(`Note On - ${noteInfo}`);
    cube.rotation.y += THREE.MathUtils.degToRad(30);
  } else if (command === 0x80 || (command === 0x90 && velocity === 0)) {
    console.log(`Note Off - ${noteInfo}`);
  }
}

// アニメーションループ
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();

//【起動前のMIDI設定手順】
// 1. WindowsでrtpMIDIを起動し、iPhone/iPadからの接続を確認
// 2. MIDIberry等で、rtpMIDI経由の信号がPCで受信可能か確認
// 3. このプログラムをnpm run dev (vite)で起動し、ブラウザからMIDIデバイスへのアクセスを許可
// 4. コンソールログでMIDIデバイス検出が表示されれば設定成功

