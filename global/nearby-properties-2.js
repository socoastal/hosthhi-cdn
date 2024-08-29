// TODO: Add view more button that shows all properties
// TODO: Improve skeleton UI to match design
// TODO: Improve no results message and UI
// TODO: Add "distance away" label and value to each property card
// TODO: Add limit to number of properties shown

function createSkeletonCard() {
    return `
        <div class="property-card skeleton-card">
        <div class="skeleton skeleton-image"></div>
        <div class="property-info">
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text"></div>
        </div>
        </div>
    `;
}

function getContainer() {
    return document.querySelector('[data-attr="dyn-content-container"]');
}

function showSkeletonLoading() {
    const container = getContainer();
    container.innerHTML = "";
    for (let i = 0; i < 6; i++) {
        container.innerHTML += createSkeletonCard();
    }
}

async function fetchProperties() {
    console.log(
        "fetchProperties triggered at:",
        new Date().toLocaleTimeString()
    );
    showSkeletonLoading();
    try {
        const coordinates = getCoordinates();
        const apiUrl = `https://hosthhi-get-nearby-properties.ocean-blvd.workers.dev/?lat=${coordinates.latitude}&lon=${coordinates.longitude}&maxDistance=5`;

        // Add a 2-second delay to test skeleton
        //await new Promise(resolve => setTimeout(resolve, 2000));

        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (data.total === 0) {
            console.log("No nearby vacation rentals found.");
            getContainer().innerHTML =
                "<p>Sorry, we could not find any nearby vacation rentals.</p>";
        } else {
            displayProperties(data.items);
        }
    } catch (error) {
        console.error(
            "Error fetching properties from Cloudflare Worker:",
            error
        );
        getContainer().innerHTML =
            "<p>Sorry, we could not find any nearby vacation rentals.</p>";
    }
}

function getCoordinates() {
    const jsonLdScript = document.querySelector(
        'script[type="application/ld+json"]'
    );
    if (jsonLdScript) {
        const jsonLdData = JSON.parse(jsonLdScript.textContent);
        if (
            jsonLdData.geo &&
            jsonLdData.geo.latitude &&
            jsonLdData.geo.longitude
        ) {
            return {
                latitude: jsonLdData.geo.latitude,
                longitude: jsonLdData.geo.longitude,
            };
        }
    }
    console.error("Coordinates not found in JSON-LD");
    return { latitude: "", longitude: "" };
}

function displayProperties(properties) {
    const container = getContainer();
    container.innerHTML = ""; // Clear any existing content

    properties.forEach((property) => {
        const card = document.createElement("div");
        card.className = "w-dyn-item";
        card.innerHTML = `
                <div class="blog_card_alt-container">
                    <div class="blog_card_alt-text-container">
                        <a href="${property.externalUrl}" target="_blank" class="blog_card_alt-link w-inline-block">
                            <h3 class="blog_card_alt-title heading-style-h5">${property.name}</h3>
                        </a>
                        <div class="blog_card_alt-category-name text-size-small">${property.neighborhood}</div>
                        <div class="property_card-stats-container">
                            <img src="https://cdn.prod.website-files.com/667b711c739ae83d1b86391c/668c854301fbfd953bdc4870_bedding-graphic.png" loading="lazy" alt="" class="property_card-item-icon">
                            <div class="property_card-item-value">${property.bedrooms}</div>
                            <div class="property_card-item-label">Beds</div>
                            <img src="https://cdn.prod.website-files.com/667b711c739ae83d1b86391c/668c8543ffb9fd60f4133792_bath-graphic.png" loading="lazy" alt="" class="property_card-item-icon">
                            <div class="property_card-item-value">${property.bathrooms}</div>
                            <div class="property_card-item-label">Baths</div>
                            <img src="https://cdn.prod.website-files.com/667b711c739ae83d1b86391c/668c854385907f5f58aa63c4_guest-graphic.png" loading="lazy" alt="" class="property_card-item-icon">
                            <div class="property_card-item-value">${property.sleeps}</div>
                            <div class="property_card-item-label">Guests</div>
                        </div>
                    </div>
                    <div class="blog_card_alt-image-container">
                        <img height="Auto" loading="lazy" src="${property.thumbnailUrl}" alt="${property.name}" class="blog_card_alt-image">
                    </div>
                </div>
            `;
        container.appendChild(card);
    });
}

function createObserver() {
    const options = {
        root: null,
        rootMargin: "0px",
        threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                fetchProperties();
                observer.unobserve(entry.target);
            }
        });
    }, options);

    const target = getContainer();
    observer.observe(target);
}

// Replace the immediate fetchProperties call with createObserver
document.addEventListener("DOMContentLoaded", () => {
    createObserver();
});
