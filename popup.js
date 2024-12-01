document.addEventListener('DOMContentLoaded', () => {
  console.log('Extension loaded');
  fetchAllData();
  
  document.getElementById('refreshBtn').addEventListener('click', () => {
    console.log('Refresh button clicked');
    fetchAllData();
  });

  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      console.log('Switching to tab:', tab.dataset.tab);
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
      document.getElementById(tab.dataset.tab).classList.add('active');
    });
  });
});

async function fetchAllData() {
  console.log('Fetching all data...');
  try {
    await Promise.all([
      fetchTopByMarketCap(),
      fetchGainers('1h'),
      fetchGainers('24h')
    ]);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

async function fetchTopByMarketCap() {
  console.log('Fetching top by market cap...');
  const cryptoList = document.getElementById('cryptoList');
  cryptoList.innerHTML = '<div class="loading">Loading...</div>';

  try {
    const url = 'https://api.coingecko.com/api/v3/coins/markets?' + 
      new URLSearchParams({
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 10,
        page: 1,
        sparkline: false,
        price_change_percentage: '1h,24h'
      });
    
    console.log('Fetching from URL:', url);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Raw market cap data:', data);
    
    // Validate and clean the data
    const cleanedData = data.map(crypto => validateCryptoData(crypto));
    console.log('Cleaned market cap data:', cleanedData);
    
    displayCryptoData(cleanedData, 'cryptoList');
  } catch (error) {
    console.error('Error fetching market cap data:', error);
    handleError(cryptoList, error.message);
  }
}

async function fetchGainers(period) {
  console.log(`Fetching ${period} gainers...`);
  const listId = period === '24h' ? 'gainers24hList' : 'gainers1hList';
  const list = document.getElementById(listId);
  list.innerHTML = '<div class="loading">Loading...</div>';

  try {
    const url = 'https://api.coingecko.com/api/v3/coins/markets?' + 
      new URLSearchParams({
        vs_currency: 'usd',
        order: period === '24h' ? 'price_change_percentage_24h_desc' : 'price_change_percentage_1h_in_currency_desc',
        per_page: 10,
        page: 1,
        sparkline: false,
        price_change_percentage: '1h,24h'
      });

    console.log(`Fetching ${period} gainers from URL:`, url);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Raw ${period} gainers data:`, data);
    
    // Validate and clean the data
    const cleanedData = data.map(crypto => validateCryptoData(crypto));
    console.log(`Cleaned ${period} gainers data:`, cleanedData);
    
    displayCryptoData(cleanedData, listId);
  } catch (error) {
    console.error(`Error fetching ${period} gainers:`, error);
    handleError(list, error.message);
  }
}

function validateCryptoData(crypto) {
  return {
    id: crypto.id || '',
    name: crypto.name || 'Unknown',
    symbol: crypto.symbol || '',
    current_price: typeof crypto.current_price === 'number' ? crypto.current_price : 0,
    image: crypto.image || '',
    price_change_percentage_1h_in_currency: parseFloat(crypto.price_change_percentage_1h_in_currency) || 0,
    price_change_percentage_24h: parseFloat(crypto.price_change_percentage_24h) || 0
  };
}

function handleError(element, errorMessage) {
  console.error('Error occurred:', errorMessage);
  element.innerHTML = `
    <div class="crypto-item" style="color: #dc3545;">
      Error loading data: ${errorMessage}. Please try again later.
    </div>
  `;
}

function displayCryptoData(cryptocurrencies, elementId) {
  console.log(`Displaying data for ${elementId}:`, cryptocurrencies);
  const cryptoList = document.getElementById(elementId);
  cryptoList.innerHTML = '';

  cryptocurrencies.forEach(crypto => {
    // Determine which price change to use
    const priceChangeField = elementId === 'gainers1hList' 
      ? crypto.price_change_percentage_1h_in_currency 
      : crypto.price_change_percentage_24h;

    console.log(`${crypto.name} price change (${elementId === 'gainers1hList' ? '1h' : '24h'}):`, priceChangeField);
    console.log(`${crypto.name} current price:`, crypto.current_price);

    const priceChangeClass = priceChangeField >= 0 ? 'price-up' : 'price-down';
    const priceChangeSymbol = priceChangeField >= 0 ? '↑' : '↓';
    
    const cryptoItem = document.createElement('div');
    cryptoItem.className = 'crypto-item';
    cryptoItem.innerHTML = `
      <img class="crypto-icon" src="${crypto.image}" alt="${crypto.name}">
      <div class="crypto-info">
        <span class="crypto-name">${crypto.name}</span>
        <span class="crypto-symbol">${crypto.symbol.toUpperCase()}</span>
      </div>
      <div>
        <span class="crypto-price">$${formatPrice(crypto.current_price)}</span>
        <span class="price-change ${priceChangeClass}">
          ${priceChangeSymbol} ${formatPercentage(priceChangeField)}%
        </span>
      </div>
    `;
    cryptoList.appendChild(cryptoItem);
  });
}

function formatPrice(price) {
  if (typeof price !== 'number' || isNaN(price)) {
    console.warn('Invalid price value:', price);
    return '0.00';
  }
  
  if (price < 0.01) {
    return price.toFixed(8);
  } else if (price < 1) {
    return price.toFixed(4);
  } else {
    return price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
}

function formatPercentage(percentage) {
  if (typeof percentage !== 'number' || isNaN(percentage)) {
    console.warn('Invalid percentage value:', percentage);
    return '0.00';
  }
  return Math.abs(percentage).toFixed(2);
}
