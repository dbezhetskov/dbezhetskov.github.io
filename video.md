# Используем wasm для обработки видео в браузере

## Описание
Мы наложим на видео эффект сепии с помощью wasm.
Цвет каждой ячейки видео кадра представляется 4-ой ARGB.
Преобразование сепии для ячейки (A1, R1, G1, B1) -> A1, C1, C1, C1, где C1 = (R1 + G1 + B1) / 3.

Сама задача будет разбита на независимые шаги, после каждого из которых вы должны получать неполное, но работающее решение. 

## Шаг 1. Запросить видео с web камеры в браузере.
- Создайте index.html и добавьте в `<body>` следующий тег:
```html
<video id="video-for-test" width="512" height="512" autoplay></video>
```

- Создайте `<script>` и добавьте в него следующий JS для инициализации веб-камеры:
```javascript
const constraints = { video: true };
navigator.mediaDevices.getUserMedia(constraints)
  .then(stream => {
      video.srcObject = stream;
      })
  .catch(err => { console.log(err); });
```

## Шаг 2. Инициализация wasm.
Напишите на AS (assembly script) в https://webassembly.studio/ функцию, которая возвращает число 42.
Скачайте получившийся `.wasm`, загрузите его на вашей странице и инициализируйте.
Посмотрите как это сделано тут и сделайте загрузку вашего `.wasm` также - https://github.com/dbezhetskov/dbezhetskov.github.io/blob/master/round_1.html.
Вызовите вашу wasm функцию и убедитесь, что она возвращает 42.

## Шаг 3. Получите информацию о текущем видео кадре и передайте его в wasm.
- Добавьте canvas на страницу:
```html
<canvas id="canvas-for-test" width="512" height="512"></canvas>
```
и получите его в JS:
```javascript
let canvas = document.getElementById('canvas-for-test');
```

- Создайте WebAssembly.Memory и передайте её в wasm
```javascript
const memSize = 10;
const memory = new WebAssembly.Memory({ initial: memSize, maximum: memSize });
```

- Импортируйте память в wasm. Это делается точно также как и проброс функции из JS в wasm.
- Cкопируйте память из видео кадра в `WebAssembly.Memory`:

```javascript
canvas.getContext('2d').drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

// FIll memory with image data from canvas
let memoryAsArray = new Uint8ClampedArray(memory.buffer, 0, width * height * 4);
let imageData = ctx.getImageData(0, 0, width, height).data;
for (let i = 0; i < memoryAsArray.length; ++i) {
  memoryAsArray[i] = imageData[i];
}

// call wasm instance.exports.YOUR_SEPIA_FUNCTION_NAME

const data = new Uint8ClampedArray(memory.buffer, 0, width * height * 4);
const img = new ImageData(data, width, height);
ctx.putImageData(img, 0, 0);
```

## Шаг 4.
Напишите функцию сепии, проверьте что все работает так, как вы ожидаете и покажите преподавателю.
Для того чтобы читать/писать в память используйте AS:
```
load<u32>(address)
store<u32>(address)
```

## Шаг 5.
Наслаждайтесь жизнью.