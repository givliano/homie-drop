export function randomToken() {
  return Math.floor((1 + Math.random()) * 1e16).toString(16).substring(1);
}

export function logError(err) {
  if (!err) return;
  if (typeof err === 'string') {
    console.warn(err);
  } else {
    console.warn(err.toString(), err);
  }
}

export function animate({ timing, draw, duration }) {
  let start = performance.now();

  requestAnimationFrame(function animate(time) {
    // timeFraction goes from 0 to 1
    let timeFraction = (time - start) / duration;
    if (timeFraction > 1) timeFraction = 1;

    // calculate the current animation state
    let progress = timing(timeFraction)

    draw(progress); // draw it

    if (timeFraction < 1) {
      requestAnimationFrame(animate);
    }
  });
}

function animatePath(el, distance) {
    if (el !== null) {
      animate({
        duration: 10,
        timing(timeFraction) {
          return timeFraction;
        },
        draw(progress) {
          el.style.strokeDashoffset = (1000 - (progress * distance));
        }
      });
    }
  }

export async function createFilePreview(file) {
  const objectURL = window.URL.createObjectURL(file);
  const img = document.createElement('img');
  const canvas = document.createElement('canvas');
  // Using the devicePixelRatio to make images sharp on Retina displays.
  canvas.style.width = '100px';
  canvas.style.height = '100px';
  canvas.width = 100 * window.devicePixelRatio;
  canvas.height = 100 * window.devicePixelRatio;
  const ctx = canvas.getContext('2d')

  console.log(file);
  canvas.classList.add('img-preview');
  canvas.dataset.id = file.name;

  img.onload = () => {
    // After img is loaded and has it's size properties,
    // calculate its position inside the canvas maintaining its aspect ratio.
    const hRatio = canvas.width / img.width;
    const vRatio =  canvas.height / img.height;
    const ratio = Math.min(hRatio, vRatio);
    const xCenterShift = (canvas.width - img.width * ratio) / 2;
    const yCenterShift = (canvas.height - img.height * ratio) / 2;

    ctx.drawImage(
      img,
      0, 0, img.width, img.height,
      xCenterShift, yCenterShift, img.width * ratio, img.height * ratio
    );

    document.getElementById('preview').appendChild(canvas);
    window.URL.revokeObjectURL(objectURL);
  }

  img.src = objectURL;
}

export function dispatchEvent(eventName, data) {
  document.dispatchEvent(new CustomEvent(eventName, { detail: data } ));
}
