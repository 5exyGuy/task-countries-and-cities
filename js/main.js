window.onload = async function () {
    if (ENVIRONMENT === ENVIRONMENT_TYPE.CITIES) {
        const country = await Country.getById(COUNTRY_ID);
        document.getElementById('countryName').innerHTML = country.name;
    }

    await updateDataTable();
    fillPageNumbers();
};

/* ----------------------------------------------------
-------------------------------------------------------
                Table functionality
-------------------------------------------------------
---------------------------------------------------- */

/**
 * Gets the country table.
 * @returns {HTMLTableSectionElement}
 */
function getDataTable() {
    return document.getElementById("dataTable").getElementsByTagName('tbody')[0];
}

/**
 * Removes all rows from the data table.
 */
function clearDataTable() {
    const dataTable = getDataTable();
    if (!dataTable) return;

    dataTable.innerHTML = '';
}

/**
 * Adds a new row to the data table.
 * @param {number} id
 * @param {any[]} args
 */
function addRow(id, ...args) {
    const dataTable = getDataTable();
    if (!dataTable) return;

    dataTable.innerHTML += tableRowTemplate(ENVIRONMENT, id, ...args);
}

/**
 * Fills the data table with data from API request.
 * @returns {Promise<void>}
 */
async function updateDataTable() {
    clearDataTable();

    if (ENVIRONMENT === ENVIRONMENT_TYPE.COUNTRIES) {
        const countries = await Country.getAll();
        countries.forEach((country) => addRow(country.id, country.name, country.area, country.population, country.callingCode));
    } else if (ENVIRONMENT === ENVIRONMENT_TYPE.CITIES) {
        const cities = await City.getAll(COUNTRY_ID);
        cities.forEach((city) => addRow(city.id, city.name, city.area, city.population, city.postcode));
    }
}

/* ----------------------------------------------------
-------------------------------------------------------
                    Data filtering
-------------------------------------------------------
---------------------------------------------------- */

let currentShift = 0;

/**
 * Changes the page number.
 * @param {number} pageNumber
 * @returns {Promise<void>}
 */
async function changePage(pageNumber) {
    const pageNumbers = document.getElementById('pageNumbers');
    pageNumbers.children[CURRENT_PAGE() - currentShift - 1].classList.remove('badge');

    Country.changePage(pageNumber);

    shiftPageNumbers();
    await updateDataTable();
}

/**
 * Goes to the previous page.
 * @returns {Promise<void>}
 */
async function previousPage() {
    let page = CURRENT_PAGE();
    if (page === 1) return;
    await changePage(CURRENT_PAGE() - 1);
}

/**
 * Goes to the next page.
 * @returns {Promise<void>}
 */
async function nextPage() {
    await changePage(CURRENT_PAGE() + 1);
}

/**
 * Fills the pagination with page numbers.
 */
function fillPageNumbers() {
    const pageNumbers = document.getElementById('pageNumbers');
    pageNumbers.innerHTML += pageNumber(1, true);

    for (let i = 1; i < MAX_VISIBLE_PAGES; i++)
        pageNumbers.innerHTML += pageNumber(i + 1, false);
}

/**
 * Shifts the page numbers if the selected page number is at the start or at the end.
 */
function shiftPageNumbers() {
    const currentPage = CURRENT_PAGE();
    const currentPageIndex = currentPage - currentShift - 1;
    const pageNumbers = document.getElementById('pageNumbers');

    if (currentPageIndex === 0 && currentShift > 0) currentShift--;
    else if (currentPageIndex === MAX_VISIBLE_PAGES - 1) currentShift++;

    for (let i = 0; i < MAX_VISIBLE_PAGES; i++) {
        if (currentShift + i + 1 === currentPage) pageNumbers.children[i].classList.add('badge');
        pageNumbers.children[i].setAttribute('onclick', `changePage(${currentShift + i + 1})`);
        pageNumbers.children[i].innerHTML = `${currentShift + i + 1}`;
    }
}

/**
 * Selects entries based on search text.
 * @param {string} text
 * @returns {Promise<void>}
 */
async function changeSearchText(text) {
    if (ENVIRONMENT === ENVIRONMENT_TYPE.COUNTRIES) Country.changeSearchText(text);
    else if (ENVIRONMENT === ENVIRONMENT_TYPE.CITIES) City.changeSearchText(text);
    await updateDataTable();
}

/**
 * Selects records created by the specified date. The form must be completed in full or will not perform data filtering by the date.
 * @param {string} name
 * @param {number} value
 * @returns {Promise<void>}
 */
async function changeDate(name, value) {
    if (ENVIRONMENT === ENVIRONMENT_TYPE.COUNTRIES) Country.changeDate(name, value);
    else if (ENVIRONMENT === ENVIRONMENT_TYPE.CITIES) City.changeDate(name, value);
    await updateDataTable();
}

/**
 * Rearranges the the table by name.
 * @returns {Promise<void>}
 */
async function changeNameOrder() {
    const dataTableOrder = document.getElementById('dataTableOrder');

    if (ENVIRONMENT === ENVIRONMENT_TYPE.COUNTRIES) {
        Country.changeOrder();
        dataTableOrder.innerHTML = orderArrow(Country.dataFilter.order);

    } else if (ENVIRONMENT === ENVIRONMENT_TYPE.CITIES) {
        City.changeOrder();
        dataTableOrder.innerHTML = orderArrow(City.dataFilter.order);
    }
    await updateDataTable();
}

/* ----------------------------------------------------
-------------------------------------------------------
                  Modal functionality
-------------------------------------------------------
---------------------------------------------------- */

const modalStates = {
    NONE: 'none',
    ADD: 'add',
    EDIT: 'edit'
}

let isModalVisible = false;
let modalState = modalStates.NONE;

/**
 * Sets modal's state and changes modal's header title.
 * @param {string} state
 */
function setModalState(state) {
    modalState = state;
    const modalHeader = document.getElementById('modalHeader');

    switch (state) {
        case modalStates.ADD:
            modalHeader.innerHTML = ENVIRONMENT === ENVIRONMENT_TYPE.COUNTRIES ? 'Pridėti šalį' : 'Pridėti miestą';
            break;
        case modalStates.EDIT:
            modalHeader.innerHTML = ENVIRONMENT === ENVIRONMENT_TYPE.COUNTRIES ? 'Atnaujinti šalį' : 'Atnaujinti miestą';
            break;
    }

}

/**
 * Gets a modal html element.
 * @returns {HTMLElement}
 */
function getModal() {
    return document.getElementById('modal');
}

/**
 * Gets a country modal form html element.
 * @returns {HTMLElement}
 */
function getModalForm() {
    return document.getElementById('modalForm');
}

/**
 * Sets modal's form values.
 * @param {number} id
 * @param {string} name
 * @param {number} area
 * @param {number} population
 * @param {number} callingCode
 * @returns {boolean}
 */
function setModalFormValues(data = {}) {
    const form = getModalForm();
    if (!form) return false;

    const formElements = form.elements;

    Object.keys(data).forEach((key) => {
        const input = formElements[key];
        if (!input) return false;

        input.value = data[key];
    });

    return true;
}

/**
 * Shows the modal at the center of the browser view.
 */
function showModal() {
    if (isModalVisible) return;

    const modal = getModal();
    if (!modal) return;

    modal.classList.remove('hide');
    modal.classList.add('show');

    document.body.style.overflow = "hidden";

    isModalVisible = true;
}

/**
 * Hides the modal.
 */
function closeModal() {
    if (!isModalVisible) return;

    const modal = getModal();
    if (!modal) return;

    modal.classList.remove('show');
    modal.classList.add('hide');

    document.body.style.overflow = "auto";

    modalState = modalStates.NONE;
    isModalVisible = false;
}

/**
 * Changes the state of modal to ADD, clears the values of the form and shows the modal.
 * @returns {Promise<void>}
 */
async function add() {
    setModalState(modalStates.ADD);
    setModalFormValues(); // TODO: REDO
    showModal();
}

/**
 * Changes the state of modal to EDIT, sets the values for the form and shows the modal.
 * @param {number} id
 * @returns {Promise<void>}
 */
async function edit(id) {
    if (ENVIRONMENT === ENVIRONMENT_TYPE.COUNTRIES) {
        const country = Country.countryMap[id];
        if (!country) return;
        setModalFormValues({
            id: country.id,
            name: country.name,
            area: country.area,
            population: country.population,
            callingCode: country.callingCode
        });
    } else if (ENVIRONMENT === ENVIRONMENT_TYPE.CITIES) {
        const city = City.cityMap[id];
        if (!city) return;
        setModalFormValues({
            id: city.id,
            name: city.name,
            area: city.area,
            population: city.population,
            postcode: city.postcode
        });
    }
    setModalState(modalStates.EDIT);
    showModal();
}

/* ----------------------------------------------------
-------------------------------------------------------
                  Countries API usage
-------------------------------------------------------
---------------------------------------------------- */

/**
 * Depending on the state, it will process the submitted form data.
 * @param {HTMLFormElement} target
 * @returns {Promise<void>}
 */
async function processCountry(target) {
    event.preventDefault();

    const formElements = target.elements;

    const id = formElements.id.value;
    const name = formElements.name.value;
    const area = formElements.area.value;
    const population = formElements.population.value;
    const callingCode = formElements.callingCode.value;

    switch (modalState) {
        case modalStates.ADD:
            await createCountry(name, area, population, callingCode);
            break;
        case modalStates.EDIT:
            await updateCountry(id, name, area, population, callingCode);
            break;
    }

    await updateDataTable();
    closeModal();
}

/**
 * Creates a country with the specified data.
 * @param {string} name
 * @param {number} area
 * @param {number} population
 * @param {number} callingCode
 * @returns {Promise<void>}
 */
async function createCountry(name, area, population, callingCode) {
    const country = new Country(name, area, population, callingCode);

    console.log(country);

    const result = await country.create();
    const message = (await result.json()).message;
    Notification.show(message);

    if (result.status !== 200) return;

    await updateDataTable();
}

/**
 * Updates the country with the specified data according to the specified country id.
 * @param {number} id
 * @param {string} name
 * @param {number} area
 * @param {number} population
 * @param {number} callingCode
 * @returns {Promise<void>}
 */
async function updateCountry(id, name, area, population, callingCode) {
    const country = Country.countryMap[id];
    if (!country) return;

    country.name = name;
    country.area = area;
    country.population = population;
    country.callingCode = callingCode;

    const result = await country.update();
    const message = (await result.json()).message;
    Notification.show(message);

    if (result.status !== 200) return;

    await updateDataTable();
}

/**
 * Deletes the country by the specified country id.
 * @param {number} id
 * @returns {Promise<void>}
 */
async function deleteCountry(id) {
    const country = Country.countryMap[id];
    if (!country) return;

    const result = await country.delete();
    const message = (await result.json()).message;
    Notification.show(message);

    if (result.status !== 200) return;

    await updateDataTable();
}

/**
 * Redirects to the cities page of the country.
 * @param {number} id
 */
function showCountryCities(id) {
    window.location.href = `cities.html?country=${id}`;
}

/* ----------------------------------------------------
-------------------------------------------------------
                  Cities API usage
-------------------------------------------------------
---------------------------------------------------- */

/**
 * Depending on the state, it will process the submitted form data.
 * @param {HTMLFormElement} target
 * @returns {Promise<void>}
 */
async function processCity(target) {
    event.preventDefault();

    const formElements = target.elements;

    const id = formElements.id.value;
    const name = formElements.name.value;
    const area = formElements.area.value;
    const population = formElements.population.value;
    const postcode = formElements.postcode.value;

    switch (modalState) {
        case modalStates.ADD:
            await createCity(name, area, population, postcode);
            break;
        case modalStates.EDIT:
            await updateCity(id, name, area, population, postcode);
            break;
    }

    await updateDataTable();
    closeModal();
}

/**
 * Creates a city with the specified data.
 * @param {string} name
 * @param {number} area
 * @param {number} population
 * @param {string} postcode
 * @returns {Promise<void>}
 */
async function createCity(name, area, population, postcode) {
    const city = new City(name, area, population, postcode, COUNTRY_ID);

    const result = await city.create();
    const message = (await result.json()).message;
    Notification.show(message);

    if (result.status !== 200) return;

    await updateDataTable();
}

/**
 * Updates the city with the specified data according to the specified city id.
 * @param {number} id
 * @param {string} name
 * @param {number} area
 * @param {number} population
 * @param {string} postcode
 * @returns {Promise<void>}
 */
async function updateCity(id, name, area, population, postcode) {
    const city = City.cityMap[id];
    if (!city) return;

    city.name = name;
    city.area = area;
    city.population = population;
    city.postcode = postcode;

    const result = await city.update();
    const message = (await result.json()).message;
    Notification.show(message);

    if (result.status !== 200) return;

    await updateDataTable();
}

/**
 * Deletes the city by the specified city id.
 * @param {number} id
 * @returns {Promise<void>}
 */
async function deleteCity(id) {
    const city = City.cityMap[id];
    if (!city) return;

    const result = await city.delete();
    const message = (await result.json()).message;
    Notification.show(message);

    if (result.status !== 200) return;

    await updateDataTable();
}