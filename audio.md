# Используем wasm для обработки audio в браузере

## Описание
Тренировка для обработки массивов аудио данных на web assembly.
Сама задача будет разбита на независимые шаги, после каждого из которых вы должны получать неполное, но работающее решение. 

## Шаг 1. Запросить аудио из файла в браузере.
- Создайте index.html, добавьте `<body>` и по аналогии с загрузкой `.wasm` файла добавьте `<input>` для аудио файла:
```html
<input type="file" id="input-audio" />
```

- Создайте `<script>` и добавьте в него следующий JS для инициализации аудио:
```javascript
const inputElement = document.getElementById("input-audio");
inputElement.addEventListener("change", handleFile, false);
function handleFile() {
    const audioFile = this.files[0];
    const audioURL = window.URL.createObjectURL(audioFile);
    initializeAudio(audioURL);
}
let AudioContext = window.AudioContext || window.webkitAudioContext;

async function initializeAudio(audioURL) {
  let audioCtx = new AudioContext();
  source = audioCtx.createBufferSource();

  let response = await fetch(audioURL);
  if (!response.ok) {
      throw new Error("HTTP error, status = " + response.status);
  }
  let buffer = await response.arrayBuffer();
  audioCtx.decodeAudioData(buffer, main.bind(undefined, audioCtx));
}
```

## Шаг 2. Воспроизведите только что обработанное аудио.
Для этого напишите функцию `main`:
```javascript
function main(audioCtx, audioBuffer) {
  console.log(audioBuffer);
  // Example of working with  audioBuffer
  // let nowBuffering = audioBuffer.getChannelData(0);
  source.buffer = audioBuffer;

  source.connect(audioCtx.destination);
  source.start();
}
```
Убедитесь что звук проигрывается.

## Шаг 3. Инициализация wasm.
Инициализируйте `wasm` и передайте в него через WebAssembly.Memory `audioBuffer` из предыдущего шага.

## Шаг 4. Инициализация wasm.
Умножьте каждый элемент `audioBuffer` в `.wasm` на 10.
Каждый элемент массива `audioBuffer` это `float32` в диапазоне от `-1.0` до `1.0`.
Скопируйте получившийся массив обратно в JS и воспроизведите получившийся `audioBuffer`.

## Шаг 5* (опционально). Напишите препобразование букв в азбуку Морзе.
Используйте `morse.mp3`, который лежит в репозитории чтобы получить последовательности для звуков - `.` и `-`.
На стороне `js` считайте строчку букв и переведите её в в азбуку Морзе.
С помощью `wasm` сгенерируйте итоговый `audioBuffer`.  

## Шаг 6.
Наслаждайтесь жизнью.
