const API_URL = 'https://akademija.teltonika.lt/api1/index.php';
const MAX_VISIBLE_PAGES = 5;
const NOTIFICATION_LIFETIME = 5000;
const ORDER_TYPE = {
    ASC: 'asc',
    DESC: 'desc'
};
const ENVIRONMENT_TYPE = {
    COUNTRIES: 'countries',
    CITIES: 'cities'
};
const CURRENT_PAGE = () => {
    if (ENVIRONMENT === ENVIRONMENT_TYPE.COUNTRIES) return Country.dataFilter.page;
    if (ENVIRONMENT === ENVIRONMENT_TYPE.CITIES) return City.dataFilter.page;
    return 1;
}

class Notification {
    static show(message) {
        const notification = document.getElementById('notification');
        if (notification.classList.contains('fadeOut')) notification.classList.remove('fadeOut');

        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = undefined;
            notification.classList.remove('fadeIn');
        }

        notification.innerHTML = message;
        notification.classList.add('fadeIn');

        this.timeoutId = setTimeout(() => {
            notification.classList.remove('fadeIn');
            notification.classList.add('fadeOut');
            this.timeoutId = undefined;
        }, NOTIFICATION_LIFETIME);
    }
}

class HttpWrapper {
    static request(method, url, data = {}) {
        method = method.toUpperCase();

        return fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: method === 'GET' || method === 'HEAD' || method === 'DELETE' ? undefined : JSON.stringify(data)
        });
    };
}

class Base {
    static dataFilter = {
        page: 1,
        order: undefined,
        searchText: undefined,
        date: {
            year: undefined,
            month: undefined,
            day: undefined
        }
    };

    static changePage(pageNumber) {
        this.dataFilter.page = pageNumber;
    }

    static changeSearchText(text) {
        this.dataFilter.searchText = text;
    }

    static changeDate(key, value) {
        if (!Object.keys(this.dataFilter.date).find((_key) => _key === key)) return;

        this.dataFilter.date[key] = value;
    }

    static changeOrder() {
        switch (this.dataFilter.order) {
            case undefined:
                this.dataFilter.order = ORDER_TYPE.ASC;
                break;
            case ORDER_TYPE.ASC:
                this.dataFilter.order = ORDER_TYPE.DESC;
                break;
            case ORDER_TYPE.DESC:
                this.dataFilter.order = ORDER_TYPE.ASC;
                break;
        }
    }

    static get query() {
        const searchParams = new URLSearchParams();
        const {page, order, searchText, date} = this.dataFilter;

        if (page) searchParams.append('page', page);
        if (order) searchParams.append('order', order);
        if (searchText) searchParams.append('text', searchText);
        if (date && date.year && date.month && date.day) searchParams.append('date', `${date.year}-${date.month}-${date.day}`)

        return searchParams.toString();
    }

    constructor(data = {}, id = undefined) {
        this.id = id;
        this.urlPart = undefined;
        this.data = {};
        Object.keys(data).forEach((key) => this.data[key] = data[key]);
    }

    set name(value) {
        this.data['name'] = value;
    }

    get name() {
        return this.data['name']
    }

    set area(value) {
        this.data['area'] = value;
    }

    get area() {
        return this.data['area']
    }

    set population(value) {
        this.data['population'] = value;
    }

    get population() {
        return this.data['population']
    }

    async create() {
        return HttpWrapper.request('POST', `${API_URL}/${this.urlPart}`, this.data);
    }

    async update() {
        return HttpWrapper.request('PUT', `${API_URL}/${this.urlPart}/${this.id}`, this.data);
    }

    async delete() {
        return HttpWrapper.request('DELETE', `${API_URL}/${this.urlPart}/${this.id}`);
    }
}

class Country extends Base {
    static URL_PART = 'countries';
    static countryMap = {};

    static async getAll(page, order, text, date) {
        const result = await HttpWrapper.request('GET', `${API_URL}/${this.URL_PART}?${Country.query}`);
        if (result.status !== 200) return [];

        const data = await result.json();
        const countries = [...data.countires];

        return countries.map((country) => {
            this.countryMap[country.id] = new Country(country.name, country.area, country.population, country.calling_code, country.id);
            return this.countryMap[country.id];
        });
    }

    static async getById(id) {
        const result = await HttpWrapper.request('GET', `${API_URL}/${this.URL_PART}/${id}`);
        if (result.status !== 200) return undefined;

        const country = await result.json();

        return new Country(country.name, country.area, country.population, country.calling_code, country.id);
    }

    constructor(name, area, population, callingCode, id = undefined) {
        super({name, area, population, calling_code: callingCode}, id);

        this.urlPart = Country.URL_PART;
    }

    set callingCode(value) {
        this.data['calling_code'] = value;
    }

    get callingCode() {
        return this.data['calling_code']
    }
}

class City extends Base {
    static URL_PART = 'cities';
    static cityMap = {};

    static async getAll(countryId) {
        const result = await HttpWrapper.request('GET', `${API_URL}/${this.URL_PART}/${countryId}?${City.query}`);
        if (result.status !== 200) return [];

        const data = await result.json();
        const cities = [...data];

        return cities.map((city) => {
            this.cityMap[city.id] = new City(city.name, city.area, city.population, city.postcode, city.country_id, city.id);
            return this.cityMap[city.id];
        });
    }

    constructor(name, area, population, postcode, countryId, id = undefined) {
        super({name, area, population, postcode, country_id: countryId}, id);

        this.urlPart = City.URL_PART;
    }

    set postcode(value) {
        this.data['postcode'] = value;
    }

    get postcode() {
        return this.data['postcode']
    }

    set countryId(value) {
        this.data['country_id'] = value;
    }

    get countryId() {
        return this.data['country_id']
    }
}