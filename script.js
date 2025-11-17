// Auto-load output_with_urls.xlsx if available
window.addEventListener('DOMContentLoaded', function () {
    fetch('output_with_urls.xlsx')
        .then(resp => {
            if (!resp.ok) throw new Error('No output_with_urls.xlsx found');
            return resp.arrayBuffer();
        })
        .then(data => {
            processExcelData(new Uint8Array(data));
        })
        .catch(() => {/* ignore if not found */ });
});
function createCarousel(images, container) {
    let idx = 0;
    const imgEl = document.createElement('img');
    imgEl.src = images[0];
    imgEl.alt = 'Product Image';
    const label = document.createElement('div');
    label.style.fontSize = '0.85em';
    label.style.color = '#888';
    label.style.textAlign = 'center';
    label.style.marginTop = '0.2em';
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '<';
    const nextBtn = document.createElement('button');
    nextBtn.textContent = '>';
    function update() {
        imgEl.src = images[idx];
        prevBtn.disabled = idx === 0;
        nextBtn.disabled = idx === images.length - 1;
        if (images[idx].startsWith('data:')) {
            label.textContent = 'Embedded Image';
            label.style.display = '';
        } else {
            label.textContent = '';
            label.style.display = 'none';
        }
    }
    prevBtn.onclick = () => { if (idx > 0) { idx--; update(); } };
    nextBtn.onclick = () => { if (idx < images.length - 1) { idx++; update(); } };
    update();
    container.appendChild(prevBtn);
    container.appendChild(imgEl);
    container.appendChild(nextBtn);
    container.appendChild(label);
}



// Upload logic removed

function processExcelData(data) {
    const messageDiv = document.getElementById('message');
    const workbook = XLSX.read(data, { type: 'array' });
    // Gather all products and categories
    let allProducts = [];
    let categories = [];
    workbook.SheetNames.forEach(sheetName => {
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        if (rows.length) {
            allProducts = allProducts.concat(rows.map(r => ({ ...r, __category: sheetName })));
            categories.push(sheetName);
        }
    });
    if (!allProducts.length) {
        messageDiv.textContent = 'No data found in file.';
        return;
    }
    // Controls
    const controls = document.getElementById('controls');
    controls.style.display = '';
    // Populate category filter
    const catFilter = document.getElementById('categoryFilter');
    catFilter.innerHTML = '<option value="">All Categories</option>' + categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    // Render function
    function render(products) {
        let resultsDiv = document.getElementById('results');
        if (!resultsDiv) {
            resultsDiv = document.createElement('div');
            resultsDiv.id = 'results';
            document.querySelector('.container').appendChild(resultsDiv);
        }
        resultsDiv.innerHTML = '';
        const grid = document.createElement('div');
        grid.className = 'products-grid';
        resultsDiv.appendChild(grid);
        products.forEach((row, i) => {
            const articleNo = row['Article No'] || row['Article No.'] || row['article no'] || row['article_no'] || row['article number'] || row['Article Number'];
            const productName = row['Product Name'] || row['product name'] || row['productname'] || '';
            const mrp = parseFloat(row['MRP'] || row['mrp'] || '');
            const pdp = row['PDP URL'] || row['pdp url'] || row['pdpurl'];
            const images = (row['Image URL'] || row['image url'] || row['imageurl'] || '').split(',').map(s => s.trim()).filter(Boolean);
            if (!articleNo && !mrp && !pdp && !images.length && !productName) return;
            const productDiv = document.createElement('div');
            productDiv.className = 'product';
            // Product image (main and hover)
            if (images.length) {
                const imgContainer = document.createElement('div');
                imgContainer.className = 'product-image-container';
                const mainImg = document.createElement('img');
                mainImg.className = 'product-image-main';
                mainImg.src = images[0];
                mainImg.alt = productName || 'Product Image';
                imgContainer.appendChild(mainImg);
                if (images.length > 1) {
                    const hoverImg = document.createElement('img');
                    hoverImg.className = 'product-image-hover';
                    hoverImg.src = images[1];
                    hoverImg.alt = productName || 'Product Image';
                    imgContainer.appendChild(hoverImg);
                }
                productDiv.appendChild(imgContainer);
            }
            // Info (bottom)
            const infoDiv = document.createElement('div');
            infoDiv.className = 'product-info';
            // Product Name
            if (productName) {
                const pname = document.createElement('div');
                pname.className = 'product-title';
                pname.textContent = productName;
                infoDiv.appendChild(pname);
            }
            // Article No
            if (articleNo) {
                const title = document.createElement('div');
                title.style.fontSize = '1em';
                title.style.color = '#555';
                title.textContent = 'Article No - ' + articleNo;
                infoDiv.appendChild(title);
            }
            // Category
            if (row.__category) {
                const cat = document.createElement('div');
                cat.style.fontSize = '0.95em';
                cat.style.color = '#888';
                cat.textContent = 'Category - ' + row.__category;
                infoDiv.appendChild(cat);
            }
            // Prices
            if (!isNaN(mrp)) {
                const pricesDiv = document.createElement('div');
                pricesDiv.className = 'product-prices';
                const mrpSpan = document.createElement('span');
                mrpSpan.className = 'product-mrp';
                mrpSpan.textContent = '₹' + mrp.toLocaleString();
                const discounted = Math.round(mrp * 0.8);
                const discountedSpan = document.createElement('span');
                discountedSpan.className = 'product-discounted';
                discountedSpan.textContent = '₹' + discounted.toLocaleString() + ' (20% OFF)';
                pricesDiv.appendChild(mrpSpan);
                pricesDiv.appendChild(discountedSpan);
                infoDiv.appendChild(pricesDiv);
            }
            // View Details button
            if (pdp) {
                const btn = document.createElement('a');
                btn.href = pdp;
                btn.textContent = 'View Details';
                btn.className = 'view-details-btn';
                btn.target = '_blank';
                infoDiv.appendChild(btn);
            }
            productDiv.appendChild(infoDiv);
            grid.appendChild(productDiv);
        });
    }
    // Filtering and sorting
    function applyFilters() {
        let filtered = allProducts;
        const cat = document.getElementById('categoryFilter').value;
        if (cat) filtered = filtered.filter(p => p.__category === cat);
        const sortBy = document.getElementById('sortBy').value;
        if (sortBy === 'name') {
            filtered = filtered.slice().sort((a, b) => (a['Product Name'] || '').localeCompare(b['Product Name'] || ''));
        } else if (sortBy === 'price') {
            filtered = filtered.slice().sort((a, b) => (parseFloat(a['MRP'] || 0)) - (parseFloat(b['MRP'] || 0)));
        } else if (sortBy === 'priceDesc') {
            filtered = filtered.slice().sort((a, b) => (parseFloat(b['MRP'] || 0)) - (parseFloat(a['MRP'] || 0)));
        }
        // Search filter
        const searchVal = (document.getElementById('searchBox')?.value || '').trim().toLowerCase();
        if (searchVal) {
            filtered = filtered.filter(p => (p['Product Name'] || '').toLowerCase().includes(searchVal) || (p['Article No'] || '').toLowerCase().includes(searchVal));
        }
        render(filtered);
    }
    document.getElementById('categoryFilter').onchange = applyFilters;
    document.getElementById('sortBy').onchange = applyFilters;
    // Menu click handlers
    document.getElementById('menu-shoes').onclick = function (e) {
        e.preventDefault();
        document.getElementById('categoryFilter').value = 'Shoes';
        applyFilters();
        setActiveMenu('menu-shoes');
    };
    document.getElementById('menu-clothings').onclick = function (e) {
        e.preventDefault();
        document.getElementById('categoryFilter').value = 'Clothings';
        applyFilters();
        setActiveMenu('menu-clothings');
    };
    document.getElementById('menu-accessories').onclick = function (e) {
        e.preventDefault();
        document.getElementById('categoryFilter').value = 'Accessories';
        applyFilters();
        setActiveMenu('menu-accessories');
    };
    function setActiveMenu(id) {
        document.querySelectorAll('.header-menu a').forEach(a => a.classList.remove('active'));
        document.getElementById(id).classList.add('active');
    }
    // Search box handler
    document.getElementById('searchBox').addEventListener('input', applyFilters);
    // Initial render
    applyFilters();
    messageDiv.textContent = 'Loaded ' + allProducts.length + ' products.';
}
