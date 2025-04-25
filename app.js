let fromCurrency = "RUB";
let toCurrency = "USD";
let currentRates = {};
let isUpdating = false;
let lastChanged = 'input';

const inputAmount = document.querySelector('.input-currency');
const outputAmount = document.querySelector('.output-currency');
const fromButtons = document.querySelectorAll('.converter .box:first-child .tabs button');
const toButtons = document.querySelectorAll('.converter .box:last-child .tabs button');
const rateInfoLeft = document.querySelector('.rate-left');
const rateInfoRight = document.querySelector('.rate-right');
const convert = () => {
  const rate = currentRates[toCurrency];
  const inverseRate = 1 / rate;

  if (fromCurrency === toCurrency) {
    const amount = lastChanged === 'input'
      ? parseFloat(inputAmount.value.replace(/\s/g, '')) || 0
      : parseFloat(outputAmount.value.replace(/\s/g, '')) || 0;
    inputAmount.value = outputAmount.value = formatNumber(amount);
    rateInfoLeft.textContent = `1 ${fromCurrency} = 1 ${toCurrency}`;
    rateInfoRight.textContent = `1 ${toCurrency} = 1 ${fromCurrency}`;
    return;
  }

  if (lastChanged === 'input') {
    const amount = parseFloat(inputAmount.value.replace(/\s/g, '')) || 0;
    outputAmount.value = formatNumber(amount * rate);
  } else {
    const amount = parseFloat(outputAmount.value.replace(/\s/g, '')) || 0;
    inputAmount.value = formatNumber(amount * inverseRate);
  }

  rateInfoLeft.textContent = `1 ${fromCurrency} = ${rate.toFixed(5)} ${toCurrency}`;
  rateInfoRight.textContent = `1 ${toCurrency} = ${inverseRate.toFixed(5)} ${fromCurrency}`;
};
const formatNumber = (num) => new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 5
}).format(num);
const updateActiveButtons = () => {
  fromButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.currency === fromCurrency));
  toButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.currency === toCurrency));
};
const getRates = async (baseCurrency) => {
  try {
    const response = await fetch(`https://v6.exchangerate-api.com/v6/f81380c8917047a5bb3a9ed3/latest/${baseCurrency}`);
    const data = await response.json();
    if (data.result === "success") {
      currentRates = data.conversion_rates;
    } else {
      throw new Error("Rate not received");
    }
  } catch (error) {
    document.querySelector('main').innerHTML = `
      <h1 style="color: red;">An error occurred.</h1>
      <p>Unable to change rates. Connection problem.</p>
    `;
  }
};

inputAmount.value = '1';
getRates(fromCurrency).then(() => {
  convert();
});



const sanitizeInput = (value) => {
  value = value.replace(',', '.').replace(/[^0-9.]/g, '');
  const dotIndex = value.indexOf('.');
  if (dotIndex !== -1) {
    const intPart = value.slice(0, dotIndex + 1);
    const decPart = value.slice(dotIndex + 1).replace(/\./g, '');
    value = intPart + decPart;
  }
  if (value === '.') value = '0.';
  if (value.includes('.')) {
    const [intPart, decPart] = value.split('.');
    value = intPart + '.' + decPart.slice(0, 5);
  }
  if (value.replace('.', '').length > 16) {
    const [intPart, decPart = ''] = value.split('.');
    value = intPart.slice(0, 16) + (decPart ? '.' + decPart.slice(0, 5) : '');
  }
  return value;
};

fromButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    fromCurrency = btn.dataset.currency;
    updateActiveButtons();
    getRates(fromCurrency).then(convert);
  });
});

toButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    toCurrency = btn.dataset.currency;
    updateActiveButtons();
    convert();
  });
});

inputAmount.addEventListener('input', () => {
  if (isUpdating) return;
  isUpdating = true;
  lastChanged = 'input';
  inputAmount.value = sanitizeInput(inputAmount.value);
  convert();
  isUpdating = false;
});

outputAmount.addEventListener('input', () => {
  if (isUpdating) return;
  isUpdating = true;
  lastChanged = 'output';
  outputAmount.value = sanitizeInput(outputAmount.value);
  convert();
  isUpdating = false;
});

getRates(fromCurrency).then(convert);