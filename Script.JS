const canvas = document.querySelector('#canvas');
const context = canvas.getContext('2d');
const landscapeImages = [
	{ image: new Image(), source: 'Images Used In Sys/Arctic glaciers.avif' },
	{ image: new Image(), source: 'Images Used In Sys/Camelback.jpg' },
	{ image: new Image(), source: 'Images Used In Sys/Cathedral-of-St-Basil-the-Blessed-Moscow.webp' },
	{ image: new Image(), source: 'Images Used In Sys/Glacier_national_park.jpg' },
	{ image: new Image(), source: 'Images Used In Sys/Great_Hall_of_the_People.jpg' },
	{ image: new Image(), source: 'Images Used In Sys/North Face Mt. Everest.webp' },
	{ image: new Image(), source: 'Images Used In Sys/Notre-Dame_west-facade.avif' },
	{ image: new Image(), source: 'Images Used In Sys/Rocky Mountains.webp' },
	{ image: new Image(), source: 'Images Used In Sys/The_Alps.jpeg' },
	{ image: new Image(), source: 'Images Used In Sys/appalacian-mountains.webp' },
	{ image: new Image(), source: 'Images Used In Sys/crater-lake-sunset.jpg' },
	{ image: new Image(), source: 'Images Used In Sys/st-peters-basilica.webp' }
];

const palette = {
	primary: '#125A8C',
	accent: '#4C2FB5',
	mask: '#000'
};

let pixelRatio = 1;
const revealDuration = 500;
const trailDuration = 450;
let selectedLandscape = Math.floor(Math.random() * landscapeImages.length);
let availableLandscapes = landscapeImages
	.map((_, index) => index)
	.filter((index) => index !== selectedLandscape);
const revealProgress = new Map();
const sigilTrail = [];
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

function drawFigure(x, y, scale, opacity) {
	const headRadius = 4 * scale;
	const bodyLength = 13 * scale;
	const limbLength = 8 * scale;

	context.save();
	context.globalAlpha = opacity;
	context.strokeStyle = '#D8E9F0';
	context.lineWidth = Math.max(1, 1.5 * scale);
	context.lineCap = 'round';
	context.beginPath();
	context.arc(x, y - bodyLength - headRadius, headRadius, 0, Math.PI * 2);
	context.moveTo(x, y - bodyLength);
	context.lineTo(x, y);
	context.moveTo(x, y - bodyLength + 4 * scale);
	context.lineTo(x - limbLength, y - bodyLength + scale);
	context.moveTo(x, y - bodyLength + 4 * scale);
	context.lineTo(x + limbLength, y - bodyLength + scale);
	context.moveTo(x, y);
	context.lineTo(x - limbLength, y + limbLength);
	context.moveTo(x, y);
	context.lineTo(x + limbLength, y + limbLength);
	context.stroke();
	context.restore();
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

	while (sigilTrail.length && timestamp - sigilTrail[0].createdAt >= trailDuration) {
		sigilTrail.shift();
	}
	sigilTrail.forEach(({ x, y, createdAt }) => {
		const progress = (timestamp - createdAt) / trailDuration;
		drawFigure(x, y, 1 - progress * 0.25, 1 - progress);
	});
	if (sigilTrail.length) {
		animationRunning = true;
	}

	if (animationRunning) {
		revealAnimationFrame = requestAnimationFrame(draw);
	}

}

canvas.addEventListener('pointermove', (event) => {
	const canvasBounds = canvas.getBoundingClientRect();
	sigilTrail.push({
		x: event.clientX - canvasBounds.left,
		y: event.clientY - canvasBounds.top,
		createdAt: performance.now()
	});
	if (sigilTrail.length > 28) {
		sigilTrail.shift();
	}

	const segment = Math.floor(event.clientX / (window.innerWidth / 3));
	if (segment === 0 || segment === 2) {
		if (!revealProgress.has(segment)) {
			revealProgress.set(segment, { startedAt: performance.now() });
			cancelAnimationFrame(revealAnimationFrame);
			revealAnimationFrame = requestAnimationFrame(draw);
		}
	}
	draw();
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