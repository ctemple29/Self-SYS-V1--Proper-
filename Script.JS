const canvas = document.querySelector('#canvas');
const context = canvas.getContext('2d');
const landscapeImages = [
	{ image: new Image(), source: 'Camelback.jpg' },
	{ image: new Image(), source: 'Notre-Dame_west-facade.avif' },
	{ image: new Image(), source: 'Rocky Mountains.webp' }
];

const palette = {
	primary: '#125A8C',
	accent: '#4C2FB5',
	mask: '#000'
};

let pixelRatio = 1;
const revealDuration = 500;
let selectedLandscape = Math.floor(Math.random() * landscapeImages.length);
let availableLandscapes = landscapeImages
	.map((_, index) => index)
	.filter((index) => index !== selectedLandscape);
const revealProgress = new Map();
let revealAnimationFrame;

landscapeImages.forEach(({ image, source }) => {
	image.src = source;
	image.addEventListener('load', draw);
});

function resizeCanvas() {
	pixelRatio = window.devicePixelRatio || 1;
	canvas.width = Math.floor(window.innerWidth * pixelRatio);
	canvas.height = Math.floor(Math.max(window.innerHeight * 0.82, 520) * pixelRatio);
	canvas.style.width = `${window.innerWidth}px`;
	canvas.style.height = `${Math.max(window.innerHeight * 0.82, 520)}px`;
	context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
	draw();
}

function drawSegmentedImage(image, x, y, width, height) {
	const segmentWidth = width / 3;

	if (!image.complete || image.naturalWidth === 0) {
		return;
	}

	const sourceSegmentWidth = image.naturalWidth / 3;
	context.drawImage(
		image,
		sourceSegmentWidth,
		0,
		sourceSegmentWidth,
		image.naturalHeight,
		x + segmentWidth,
		y,
		segmentWidth,
		height
	);

	[0, 2].forEach((segment) => {
		context.drawImage(
			image,
			sourceSegmentWidth * segment,
			0,
			sourceSegmentWidth,
			image.naturalHeight,
			x + segmentWidth * segment,
			y,
			segmentWidth,
			height
		);
	});

	[0, 2].forEach((segment) => {
		const reveal = revealProgress.get(segment);
		const progress = reveal ? reveal.progress : 0;
		if (progress >= 1) {
			return;
		}

		const gradient = context.createRadialGradient(
			x + segmentWidth * segment + segmentWidth / 2,
			y + height / 2,
			0,
			x + segmentWidth * segment + segmentWidth / 2,
			y + height / 2,
			Math.max(segmentWidth, height) / 2
		);
		gradient.addColorStop(0, palette.mask);
		gradient.addColorStop(1, '#292929');
		context.globalAlpha = 1 - progress;
		context.fillStyle = gradient;
		context.fillRect(x + segmentWidth * segment, y, segmentWidth, height);
		context.globalAlpha = 1;
	});
}

function draw(timestamp = performance.now()) {
	const width = window.innerWidth;
	const height = Math.max(window.innerHeight * 0.82, 520);

	context.clearRect(0, 0, width, height);
	context.fillStyle = palette.primary;
	context.fillRect(0, 0, width, height);

	let animationRunning = false;
	revealProgress.forEach((reveal) => {
		reveal.progress = Math.min(1, (timestamp - reveal.startedAt) / revealDuration);
		animationRunning ||= reveal.progress < 1;
	});

	drawSegmentedImage(
		landscapeImages[selectedLandscape].image,
		0,
		0,
		width,
		height
	);

	if (animationRunning) {
		revealAnimationFrame = requestAnimationFrame(draw);
	}

}

canvas.addEventListener('pointermove', (event) => {
	const segment = Math.floor(event.clientX / (window.innerWidth / 3));
	if (segment === 0 || segment === 2) {
		if (!revealProgress.has(segment)) {
			revealProgress.set(segment, { startedAt: performance.now() });
			cancelAnimationFrame(revealAnimationFrame);
			revealAnimationFrame = requestAnimationFrame(draw);
		}
		draw();
	}
});

canvas.addEventListener('pointerdown', (event) => {
	if (availableLandscapes.length === 0) {
		availableLandscapes = landscapeImages
			.map((_, index) => index)
			.filter((index) => index !== selectedLandscape);
	}

	const randomPosition = Math.floor(Math.random() * availableLandscapes.length);
	selectedLandscape = availableLandscapes.splice(randomPosition, 1)[0];
	revealProgress.clear();
	cancelAnimationFrame(revealAnimationFrame);
	draw();
});

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
if (document.fonts) {
	document.fonts.ready.then(draw);
}