
document.getElementById('excelFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        // Process all three sheets and add category
        let allProducts = [];
        const sheetCategoryMap = {
            'Footwear': 'Footwear',
            'App': 'Clothings',
            'Acc': 'Accessories'
        };
        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet);
            const category = sheetCategoryMap[sheetName] || sheetName;
            json.forEach(row => {
                row._category = category;
            });
            allProducts = allProducts.concat(json);
        });
        generateProductTiles(allProducts);
    };
    reader.readAsArrayBuffer(file);
});

function generateProductTiles(products) {
    const container = document.getElementById('product-tiles');
    container.innerHTML = '';
    for (const product of products) {
        const tile = document.createElement('div');
        tile.className = 'product-tile';

        // Article Number and MRP from Excel
        const articleNumber = product['Article'] || product['Article No'] || product['Article No.'] || product['ArticleNumber'] || product['article_number'] || product['article'] || '';
        const mrp = product['MRP'] || product['mrp'] || '';
        const category = product._category || '';

        if (!articleNumber) {
            console.warn('No Article Number found for row:', product);
        }

        const title = document.createElement('div');
        title.className = 'product-title';
        title.textContent = articleNumber || 'No Article Number';

        const price = document.createElement('div');
        price.className = 'product-price';
        price.textContent = mrp ? `MRP: ₹${mrp}` : '';

        // Discounted price (MRP - 20%)
        let discounted = '';
        if (mrp && !isNaN(Number(mrp))) {
            const disc = Math.round(Number(mrp) * 0.8);
            discounted = `Expected Discounted: ₹${disc}`;
        }
        const discountDiv = document.createElement('div');
        discountDiv.style.color = '#d32f2f';
        discountDiv.style.fontWeight = 'bold';
        discountDiv.textContent = discounted;

        // Category
        const catDiv = document.createElement('div');
        catDiv.style.fontSize = '0.95em';
        catDiv.style.color = '#555';
        catDiv.textContent = category;

        tile.appendChild(title);
        tile.appendChild(price);
        tile.appendChild(discountDiv);
        tile.appendChild(catDiv);
        container.appendChild(tile);
    }
}
