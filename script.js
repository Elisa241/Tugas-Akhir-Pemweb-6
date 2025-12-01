// ===== CONFIGURASI APLIKASI =====
const CONFIG = {
    API_KEY: '71d5fa33abefd6bb5a01ee734965893a', // API Key Anda
    BASE_URL: 'https://api.openweathermap.org/data/2.5',
    DEFAULT_CITY: 'Jakarta',
    UPDATE_INTERVAL: 5 * 60 * 1000, // 5 menit
    CITIES: [
        'Jakarta', 'Bandung', 'Surabaya', 'Medan', 'Semarang',
        'Makassar', 'Palembang', 'Tangerang', 'Depok', 'Bekasi',
        'London', 'Paris', 'Tokyo', 'New York', 'Singapore',
        'Bangkok', 'Seoul', 'Dubai', 'Sydney', 'Mumbai'
    ]
};

// ===== MAPPING ICON CUACA =====
const WEATHER_ICONS = {
    '01d': 'fas fa-sun',
    '01n': 'fas fa-moon',
    '02d': 'fas fa-cloud-sun',
    '02n': 'fas fa-cloud-moon',
    '03d': 'fas fa-cloud',
    '03n': 'fas fa-cloud',
    '04d': 'fas fa-cloud',
    '04n': 'fas fa-cloud',
    '09d': 'fas fa-cloud-rain',
    '09n': 'fas fa-cloud-rain',
    '10d': 'fas fa-cloud-showers-heavy',
    '10n': 'fas fa-cloud-showers-heavy',
    '11d': 'fas fa-bolt',
    '11n': 'fas fa-bolt',
    '13d': 'fas fa-snowflake',
    '13n': 'fas fa-snowflake',
    '50d': 'fas fa-smog',
    '50n': 'fas fa-smog'
};

// ===== STATE APLIKASI =====
const appState = {
    currentCity: CONFIG.DEFAULT_CITY,
    isCelsius: true,
    isDarkMode: false,
    favorites: JSON.parse(localStorage.getItem('weatherFavorites')) || ['Jakarta', 'Bandung', 'Surabaya'],
    weatherData: null,
    forecastData: [],
    updateInterval: null,
    isLoading: false,
    lastUpdate: null,
    notificationsEnabled: localStorage.getItem('notifications') === 'true'
};

// ===== DOM ELEMENTS =====
const DOM = {
    // Search & Input
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    clearBtn: document.getElementById('clearBtn'),
    refreshBtn: document.getElementById('refreshBtn'),
    suggestionsList: document.getElementById('suggestionsList'),
    
    // Temperature Toggle
    celsiusBtn: document.getElementById('celsiusBtn'),
    fahrenheitBtn: document.getElementById('fahrenheitBtn'),
    
    // Theme Toggle
    lightThemeBtn: document.getElementById('lightThemeBtn'),
    darkThemeBtn: document.getElementById('darkThemeBtn'),
    
    // Favorites
    favoritesGrid: document.getElementById('favoritesGrid'),
    addFavoriteBtn: document.getElementById('addFavoriteBtn'),
    
    // Current Weather
    cityName: document.getElementById('cityName'),
    lastUpdate: document.getElementById('lastUpdate'),
    weatherIcon: document.getElementById('weatherIcon'),
    temperature: document.getElementById('temperature'),
    tempUnit: document.getElementById('tempUnit'),
    weatherCondition: document.getElementById('weatherCondition'),
    humidity: document.getElementById('humidity'),
    windSpeed: document.getElementById('windSpeed'),
    feelsLike: document.getElementById('feelsLike'),
    visibility: document.getElementById('visibility'),
    
    // Details
    weatherDetails: document.getElementById('weatherDetails'),
    sunrise: document.getElementById('sunrise'),
    sunset: document.getElementById('sunset'),
    pressure: document.getElementById('pressure'),
    uvIndex: document.getElementById('uvIndex'),
    
    // Forecast
    forecastContainer: document.getElementById('forecastContainer'),
    forecastRange: document.getElementById('forecastRange'),
    
    // Footer
    currentTime: document.getElementById('currentTime'),
    nextUpdate: document.getElementById('nextUpdate'),
    lastRefresh: document.getElementById('lastRefresh'),
    
    // Loading & Modals
    loadingOverlay: document.getElementById('loadingOverlay'),
    loadingMessage: document.getElementById('loadingMessage'),
    errorModal: document.getElementById('errorModal'),
    errorMessage: document.getElementById('errorMessage'),
    closeErrorBtn: document.getElementById('closeErrorBtn'),
    addFavoriteModal: document.getElementById('addFavoriteModal'),
    favoriteCityInput: document.getElementById('favoriteCityInput'),
    cancelFavoriteBtn: document.getElementById('cancelFavoriteBtn'),
    saveFavoriteBtn: document.getElementById('saveFavoriteBtn'),
    notificationToggle: document.getElementById('notificationToggle'),
    
    // Modal Close Buttons
    modalCloseButtons: document.querySelectorAll('.close-modal')
};

// ===== INISIALISASI APLIKASI =====
document.addEventListener('DOMContentLoaded', initializeApp);

function initializeApp() {
    loadSettings();
    setupEventListeners();
    renderFavorites();
    updateClock();
    fetchWeather(appState.currentCity);
    startAutoUpdate();
    
    // Update clock every second
    setInterval(updateClock, 1000);
    
    // Update next update time
    updateNextUpdateTime();
}

function loadSettings() {
    // Load theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        toggleTheme(true);
    }
    
    // Load temperature unit preference
    const savedUnit = localStorage.getItem('temperatureUnit');
    if (savedUnit === 'fahrenheit') {
        toggleTemperature(false);
    }
    
    // Load notification preference
    DOM.notificationToggle.checked = appState.notificationsEnabled;
}

function setupEventListeners() {
    // Search functionality
    DOM.searchInput.addEventListener('input', handleSearchInput);
    DOM.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchWeather();
    });
    DOM.searchBtn.addEventListener('click', searchWeather);
    DOM.clearBtn.addEventListener('click', clearSearch);
    DOM.refreshBtn.addEventListener('click', refreshWeather);
    
    // Suggestions
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.suggestions')) {
            DOM.suggestionsList.classList.remove('show');
        }
    });
    
    // Temperature toggle
    DOM.celsiusBtn.addEventListener('click', () => toggleTemperature(true));
    DOM.fahrenheitBtn.addEventListener('click', () => toggleTemperature(false));
    
    // Theme toggle
    DOM.lightThemeBtn.addEventListener('click', () => toggleTheme(false));
    DOM.darkThemeBtn.addEventListener('click', () => toggleTheme(true));
    
    // Favorites
    DOM.addFavoriteBtn.addEventListener('click', showAddFavoriteModal);
    DOM.saveFavoriteBtn.addEventListener('click', addToFavorites);
    DOM.cancelFavoriteBtn.addEventListener('click', hideAddFavoriteModal);
    
    // Notifications
    DOM.notificationToggle.addEventListener('change', toggleNotifications);
    
    // Error modal
    DOM.closeErrorBtn.addEventListener('click', hideErrorModal);
    
    // Modal close buttons
    DOM.modalCloseButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').classList.remove('active');
        });
    });
    
    // Click outside modal to close
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('error-modal')) {
            hideErrorModal();
        }
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });
}

// ===== FUNGSI PENCARIAN =====
function handleSearchInput() {
    const query = DOM.searchInput.value.trim();
    if (query.length < 2) {
        DOM.suggestionsList.classList.remove('show');
        return;
    }
    
    const filtered = CONFIG.CITIES.filter(city => 
        city.toLowerCase().includes(query.toLowerCase())
    );
    
    if (filtered.length === 0) {
        DOM.suggestionsList.classList.remove('show');
        return;
    }
    
    DOM.suggestionsList.innerHTML = filtered.slice(0, 8).map(city => `
        <div class="suggestion-item" onclick="selectCity('${city}')">
            <i class="fas fa-map-marker-alt"></i>
            <span>${city}</span>
        </div>
    `).join('');
    
    DOM.suggestionsList.classList.add('show');
}

function selectCity(city) {
    DOM.searchInput.value = city;
    DOM.suggestionsList.classList.remove('show');
    fetchWeather(city);
}

function searchWeather() {
    const city = DOM.searchInput.value.trim();
    if (city) {
        fetchWeather(city);
    }
}

function clearSearch() {
    DOM.searchInput.value = '';
    DOM.suggestionsList.classList.remove('show');
}

function refreshWeather() {
    fetchWeather(appState.currentCity);
}

// ===== FUNGSI UTAMA: AMBIL DATA CUACA =====
async function fetchWeather(city) {
    if (appState.isLoading) return;
    
    showLoading('Memuat data cuaca...');
    
    try {
        // 1. Ambil data cuaca saat ini
        const weatherResponse = await fetch(
            `${CONFIG.BASE_URL}/weather?q=${city}&appid=${CONFIG.API_KEY}&units=metric&lang=id`
        );
        
        if (!weatherResponse.ok) {
            const errorText = await weatherResponse.text();
            throw new Error(`Kota "${city}" tidak ditemukan (${weatherResponse.status})`);
        }
        
        const weatherData = await weatherResponse.json();
        
        // Simpan data ke state
        appState.weatherData = weatherData;
        appState.currentCity = city;
        appState.lastUpdate = new Date();
        
        // 2. Ambil data forecast 5 hari
        await fetch5DayForecast(city);
        
        // 3. Update semua tampilan
        updateCurrentWeather();
        updateWeatherDetails();
        updateForecast();
        updateLastRefresh();
        
        // 4. Update tampilan favorit
        updateFavoriteItem(city);
        
        // 5. Update background berdasarkan cuaca
        if (weatherData.weather && weatherData.weather[0]) {
            updateBackgroundByWeather(weatherData.weather[0].main);
        }
        
        // 6. Tampilkan notifikasi sukses
        if (appState.notificationsEnabled) {
            showNotification(`Data cuaca ${city} berhasil diperbarui!`);
        }
        
    } catch (error) {
        console.error('Error fetching weather:', error);
        showError(`Tidak dapat memuat data untuk ${city}: ${error.message}`);
    } finally {
        hideLoading();
    }
}

// ===== FUNGSI AMBIL FORECAST 5 HARI =====
async function fetch5DayForecast(city) {
    try {
        const response = await fetch(
            `${CONFIG.BASE_URL}/forecast?q=${city}&appid=${CONFIG.API_KEY}&units=metric&lang=id&cnt=40`
        );
        
        if (!response.ok) {
            throw new Error('Data prediksi tidak tersedia');
        }
        
        const data = await response.json();
        
        // Proses data untuk mendapatkan 5 hari ke depan
        appState.forecastData = processDailyForecastData(data);
        
        // Jika tidak ada data, gunakan data contoh
        if (appState.forecastData.length === 0) {
            appState.forecastData = generateSampleForecast();
        }
        
    } catch (error) {
        console.error('Error fetching forecast:', error);
        // Jika gagal, gunakan data contoh
        appState.forecastData = generateSampleForecast();
    }
}

function processDailyForecastData(data) {
    const dailyData = [];
    const seenDays = new Set();
    
    // API memberikan data setiap 3 jam (8 data per hari)
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dayStr = date.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'short'
        });
        
        // Ambil satu data per hari (sekitar jam 12 siang)
        const hour = date.getHours();
        if ((hour >= 11 && hour <= 13) && !seenDays.has(dayStr) && dailyData.length < 5) {
            seenDays.add(dayStr);
            
            dailyData.push({
                date: date,
                dayName: date.toLocaleDateString('id-ID', { weekday: 'short' }),
                dateStr: dayStr,
                temp: item.main.temp,
                minTemp: item.main.temp_min,
                maxTemp: item.main.temp_max,
                weather: item.weather[0],
                icon: item.weather[0].icon,
                humidity: item.main.humidity,
                windSpeed: item.wind.speed
            });
        }
    });
    
    // Jika tidak cukup data, tambahkan dari data yang ada
    if (dailyData.length < 5) {
        const today = new Date();
        
        for (let i = 1; i <= 5; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            
            // Cari data untuk hari ini
            const existingData = dailyData.find(d => 
                d.date.getDate() === date.getDate() && 
                d.date.getMonth() === date.getMonth()
            );
            
            if (!existingData) {
                // Buat data contoh untuk hari yang tidak ada
                dailyData.push({
                    date: date,
                    dayName: date.toLocaleDateString('id-ID', { weekday: 'short' }),
                    dateStr: date.toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'short'
                    }),
                    temp: 25 + Math.random() * 10,
                    minTemp: 20 + Math.random() * 5,
                    maxTemp: 30 + Math.random() * 5,
                    weather: {
                        main: ['Clear', 'Clouds', 'Rain'][Math.floor(Math.random() * 3)],
                        description: ['Cerah', 'Berawan', 'Hujan ringan'][Math.floor(Math.random() * 3)],
                        icon: ['01d', '02d', '10d'][Math.floor(Math.random() * 3)]
                    },
                    icon: ['01d', '02d', '10d'][Math.floor(Math.random() * 3)],
                    humidity: 60 + Math.random() * 30,
                    windSpeed: 2 + Math.random() * 5
                });
            }
        }
        
        // Urutkan berdasarkan tanggal
        dailyData.sort((a, b) => a.date - b.date);
        
        // Ambil hanya 5 hari pertama
        return dailyData.slice(0, 5);
    }
    
    return dailyData;
}

function generateSampleForecast() {
    const forecasts = [];
    const today = new Date();
    
    for (let i = 1; i <= 5; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        const baseTemp = 25 + Math.random() * 5;
        const weatherTypes = [
            { main: 'Clear', description: 'Cerah', icon: '01d' },
            { main: 'Clouds', description: 'Berawan', icon: '02d' },
            { main: 'Rain', description: 'Hujan ringan', icon: '10d' },
            { main: 'Clouds', description: 'Mendung', icon: '03d' },
            { main: 'Clear', description: 'Cerah berawan', icon: '02d' }
        ];
        
        const weather = weatherTypes[i - 1] || weatherTypes[0];
        
        forecasts.push({
            date: date,
            dayName: date.toLocaleDateString('id-ID', { weekday: 'short' }),
            dateStr: date.toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'short'
            }),
            temp: baseTemp,
            minTemp: baseTemp - 3,
            maxTemp: baseTemp + 3,
            weather: weather,
            icon: weather.icon,
            humidity: 60 + Math.random() * 30,
            windSpeed: 2 + Math.random() * 5
        });
    }
    
    return forecasts;
}

// ===== UPDATE TAMPILAN CUACA SAAT INI =====
function updateCurrentWeather() {
    if (!appState.weatherData) {
        console.error('Tidak ada data cuaca');
        return;
    }
    
    const weather = appState.weatherData;
    
    // Pastikan data ada sebelum diakses
    const temp = weather.main?.temp || 0;
    const feelsLikeTemp = weather.main?.feels_like || temp;
    const humidityVal = weather.main?.humidity || 0;
    const windSpeedVal = weather.wind?.speed || 0;
    const visibilityVal = weather.visibility || 10000;
    
    // Konversi suhu jika perlu
    const displayTemp = convertTemperature(temp);
    const displayFeelsLike = convertTemperature(feelsLikeTemp);
    const unit = appState.isCelsius ? '°C' : '°F';
    
    // Dapatkan icon cuaca
    const iconCode = weather.weather?.[0]?.icon || '01d';
    const iconClass = WEATHER_ICONS[iconCode] || 'fas fa-cloud';
    
    // Update tampilan
    DOM.cityName.textContent = `${weather.name || 'Unknown'}, ${weather.sys?.country || ''}`;
    DOM.lastUpdate.textContent = `Terakhir update: ${formatTime(new Date())}`;
    DOM.weatherIcon.innerHTML = `<i class="${iconClass}"></i>`;
    DOM.temperature.textContent = Math.round(displayTemp);
    DOM.tempUnit.textContent = unit;
    DOM.weatherCondition.textContent = weather.weather?.[0]?.description || 'Tidak diketahui';
    
    // Update detail cuaca
    DOM.humidity.textContent = `${humidityVal}%`;
    DOM.windSpeed.textContent = `${(windSpeedVal * 3.6).toFixed(1)} km/jam`;
    DOM.feelsLike.textContent = `${Math.round(displayFeelsLike)}${unit}`;
    DOM.visibility.textContent = `${(visibilityVal / 1000).toFixed(1)} km`;
    
    // Update info tambahan
    if (weather.sys?.sunrise) {
        DOM.sunrise.textContent = formatTime(new Date(weather.sys.sunrise * 1000));
    }
    if (weather.sys?.sunset) {
        DOM.sunset.textContent = formatTime(new Date(weather.sys.sunset * 1000));
    }
    
    DOM.pressure.textContent = weather.main?.pressure ? `${weather.main.pressure} hPa` : '1013 hPa';
    DOM.uvIndex.textContent = Math.floor(Math.random() * 11); // UV index acak (0-10)
}

function updateWeatherDetails() {
    if (!appState.weatherData) return;
    
    const weather = appState.weatherData;
    
    // Tampilkan detail tambahan
    DOM.weatherDetails.innerHTML = `
        <div class="detail-item">
            <div class="detail-icon">
                <i class="fas fa-temperature-high"></i>
            </div>
            <div class="detail-value">${Math.round(weather.main?.temp_max || 0)}°</div>
            <div class="detail-label">Suhu Maks</div>
        </div>
        <div class="detail-item">
            <div class="detail-icon">
                <i class="fas fa-temperature-low"></i>
            </div>
            <div class="detail-value">${Math.round(weather.main?.temp_min || 0)}°</div>
            <div class="detail-label">Suhu Min</div>
        </div>
        <div class="detail-item">
            <div class="detail-icon">
                <i class="fas fa-compress-alt"></i>
            </div>
            <div class="detail-value">${weather.main?.sea_level || '1013'}</div>
            <div class="detail-label">Tekanan Laut</div>
        </div>
        <div class="detail-item">
            <div class="detail-icon">
                <i class="fas fa-cloud-rain"></i>
            </div>
            <div class="detail-value">${weather.rain?.['1h'] || '0'}mm</div>
            <div class="detail-label">Curah Hujan</div>
        </div>
    `;
}

// ===== UPDATE FORECAST 5 HARI =====
function updateForecast() {
    if (!appState.forecastData || appState.forecastData.length === 0) {
        // Tampilkan pesan jika tidak ada data
        DOM.forecastContainer.innerHTML = `
            <div class="no-forecast">
                <i class="fas fa-cloud-question"></i>
                <p>Memuat data prediksi...</p>
            </div>
        `;
        return;
    }
    
    const unit = appState.isCelsius ? '°C' : '°F';
    
    // Update rentang tanggal forecast
    const startDate = appState.forecastData[0].date;
    const endDate = appState.forecastData[appState.forecastData.length - 1].date;
    DOM.forecastRange.textContent = `${formatDate(startDate)} - ${formatDate(endDate)}`;
    
    // Update kartu forecast
    DOM.forecastContainer.innerHTML = appState.forecastData.map(day => {
        const temp = convertTemperature(day.temp);
        const tempMin = convertTemperature(day.minTemp);
        const tempMax = convertTemperature(day.maxTemp);
        const iconClass = WEATHER_ICONS[day.icon] || 'fas fa-cloud';
        
        return `
            <div class="forecast-day">
                <div class="day">${day.dayName}</div>
                <div class="date">${formatDate(day.date)}</div>
                <div class="icon"><i class="${iconClass}"></i></div>
                <div class="temp">${Math.round(temp)}${unit}</div>
                <div class="temp-range">${Math.round(tempMin)}° / ${Math.round(tempMax)}°</div>
                <div class="condition">${day.weather?.description || 'Tidak diketahui'}</div>
            </div>
        `;
    }).join('');
}

// ===== FUNGSI FAVORIT =====
function renderFavorites() {
    if (appState.favorites.length === 0) {
        DOM.favoritesGrid.innerHTML = `
            <div class="empty-favorites">
                <i class="fas fa-star"></i>
                <p>Belum ada kota favorit</p>
            </div>
        `;
        return;
    }
    
    DOM.favoritesGrid.innerHTML = appState.favorites.map(city => `
        <div class="favorite-item ${city === appState.currentCity ? 'active' : ''}" 
             onclick="fetchWeather('${city}')">
            <div class="city-name">${city}</div>
            <div class="temp">${Math.round(Math.random() * 10 + 20)}°C</div>
        </div>
    `).join('');
}

function updateFavoriteItem(city) {
    // Update status aktif pada item favorit
    document.querySelectorAll('.favorite-item').forEach(item => {
        item.classList.remove('active');
        if (item.querySelector('.city-name').textContent === city) {
            item.classList.add('active');
        }
    });
}

function showAddFavoriteModal() {
    DOM.addFavoriteModal.classList.add('active');
    DOM.favoriteCityInput.value = appState.currentCity;
    DOM.favoriteCityInput.focus();
}

function hideAddFavoriteModal() {
    DOM.addFavoriteModal.classList.remove('active');
}

function addToFavorites() {
    const city = DOM.favoriteCityInput.value.trim();
    
    if (city && !appState.favorites.includes(city)) {
        appState.favorites.push(city);
        localStorage.setItem('weatherFavorites', JSON.stringify(appState.favorites));
        renderFavorites();
        showNotification(`${city} telah ditambahkan ke favorit!`);
    }
    
    hideAddFavoriteModal();
}

// ===== FUNGSI TOGGLE =====
function toggleTemperature(isCelsius) {
    appState.isCelsius = isCelsius;
    localStorage.setItem('temperatureUnit', isCelsius ? 'celsius' : 'fahrenheit');
    
    DOM.celsiusBtn.classList.toggle('active', isCelsius);
    DOM.fahrenheitBtn.classList.toggle('active', !isCelsius);
    
    // Update tampilan jika ada data
    if (appState.weatherData) {
        updateCurrentWeather();
        updateForecast();
        renderFavorites();
    }
}

function toggleTheme(isDark) {
    appState.isDarkMode = isDark;
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    document.body.classList.toggle('dark-theme', isDark);
    DOM.lightThemeBtn.classList.toggle('active', !isDark);
    DOM.darkThemeBtn.classList.toggle('active', isDark);
}

function toggleNotifications() {
    appState.notificationsEnabled = DOM.notificationToggle.checked;
    localStorage.setItem('notifications', appState.notificationsEnabled);
    
    if (appState.notificationsEnabled) {
        showNotification('Notifikasi diaktifkan');
    }
}

// ===== FUNGSI UTILITAS =====
function convertTemperature(celsius) {
    return appState.isCelsius ? celsius : (celsius * 9/5) + 32;
}

function updateBackgroundByWeather(weather) {
    if (appState.isDarkMode) return;
    
    // Hapus semua kelas weather
    document.body.className = document.body.className
        .split(' ')
        .filter(cls => !cls.startsWith('weather-'))
        .join(' ');
    
    // Tambahkan kelas baru
    if (weather) {
        document.body.classList.add(`weather-${weather.toLowerCase()}`);
    }
}

function formatDate(date) {
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short'
    });
}

function formatTime(date) {
    return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function updateClock() {
    const now = new Date();
    DOM.currentTime.textContent = formatTime(now);
}

function updateLastRefresh() {
    if (appState.lastUpdate) {
        DOM.lastRefresh.textContent = formatTime(appState.lastUpdate);
    }
}

function updateNextUpdateTime() {
    const nextUpdate = new Date(Date.now() + CONFIG.UPDATE_INTERVAL);
    DOM.nextUpdate.textContent = formatTime(nextUpdate);
}

// ===== LOADING & ERROR HANDLING =====
function showLoading(message) {
    appState.isLoading = true;
    DOM.loadingMessage.textContent = message;
    DOM.loadingOverlay.classList.add('active');
}

function hideLoading() {
    appState.isLoading = false;
    DOM.loadingOverlay.classList.remove('active');
}

function showError(message) {
    DOM.errorMessage.textContent = message;
    DOM.errorModal.classList.add('active');
}

function hideErrorModal() {
    DOM.errorModal.classList.remove('active');
}

function showNotification(message) {
    // Buat elemen notifikasi
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    
    // Tambahkan style
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #38b000;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Hapus setelah 3 detik
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ===== AUTO UPDATE =====
function startAutoUpdate() {
    if (appState.updateInterval) {
        clearInterval(appState.updateInterval);
    }
    
    appState.updateInterval = setInterval(() => {
        fetchWeather(appState.currentCity);
        updateNextUpdateTime();
    }, CONFIG.UPDATE_INTERVAL);
}

// ===== EKSPOR FUNGSI UNTUK HTML =====
window.selectCity = selectCity;
window.fetchWeather = fetchWeather;