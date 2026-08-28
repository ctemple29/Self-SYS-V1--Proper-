const canvas = document.querySelector('#canvas');
const context = canvas.getContext('2d');
const landscapeImages = [
	{ image: new Image(), source: 'Camelback.jpg' },
	{ image: new Image(), source: 'Notre-Dame_west-facade.avif' },
	{ image: new Image(), source: 'Rocky Mountains.webp' }
];

const palette = {
	primary: '#1C91D9',
	accent: '#4C2FB5',
	mask: '#000'
};

let pixelRatio = 1;
let selectedLandscape = Math.floor(Math.random() * landscapeImages.length);
let availableLandscapes = landscapeImages
	.map((_, index) => index)
	.filter((index) => index !== selectedLandscape);
const revealedSegments = new Set();

landscapeImages.forEach(({ image, source }) => {
	image.src = source;
	image.addEventListener('load', draw);
});

function getHeaderHeight() {
	return Math.max(230, Math.min(350, window.innerHeight * 0.36));
}

function resizeCanvas() {
	pixelRatio = window.devicePixelRatio || 1;
	canvas.width = Math.floor(window.innerWidth * pixelRatio);
	canvas.height = Math.floor(window.innerHeight * pixelRatio);
	canvas.style.width = `${window.innerWidth}px`;
	canvas.style.height = `${window.innerHeight}px`;
	context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
	draw();
}

function drawSegmentedImage(image, x, y, width, height) {
	const segmentWidth = width / 3;

	[0, 2].forEach((segment) => {
		if (revealedSegments.has(segment)) {
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
		context.fillStyle = gradient;
		context.fillRect(x + segmentWidth * segment, y, segmentWidth, height);
	});

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

	revealedSegments.forEach((segment) => {
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
}

function draw() {
	const width = window.innerWidth;
	const height = window.innerHeight;
	const headerHeight = getHeaderHeight();
	const imageHeight = Math.max(1, height - headerHeight);

	context.clearRect(0, 0, width, height);
	context.fillStyle = '#1C91D9';
	context.fillRect(0, 0, width, height);

	context.fillStyle = 'rgba(0, 0, 0, 0.18)';
	context.fillRect(0, headerHeight - 1, width, 1);
	drawSegmentedImage(
		landscapeImages[selectedLandscape].image,
		0,
		headerHeight,
		width,
		imageHeight
	);

	context.fillStyle = '#4C2FB5';
	context.fillRect(0, headerHeight, width, 5);
}

canvas.addEventListener('pointermove', (event) => {
	const headerHeight = getHeaderHeight();
	if (event.clientY < headerHeight) {
		return;
	}

	const segment = Math.floor(event.clientX / (window.innerWidth / 3));
	if (segment === 0 || segment === 2) {
		revealedSegments.add(segment);
		draw();
	}
});

canvas.addEventListener('pointerdown', (event) => {
	if (event.clientY < getHeaderHeight()) {
		return;
	}

	if (availableLandscapes.length === 0) {
		availableLandscapes = landscapeImages
			.map((_, index) => index)
			.filter((index) => index !== selectedLandscape);
	}

	const randomPosition = Math.floor(Math.random() * availableLandscapes.length);
	selectedLandscape = availableLandscapes.splice(randomPosition, 1)[0];
	revealedSegments.clear();
	draw();
});

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
if (document.fonts) {
	document.fonts.ready.then(draw);
}