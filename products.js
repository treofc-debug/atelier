/**
 * JENY Modas — Products Data
 * Database de produtos da loja
 */

const productsData = [
    {
        id: 1,
        name: "Biquíni Royal Off-White",
        category: "praia",
        categoryLabel: "Praia",
        price: 294.99,
        originalPrice: 347.00,
        badge: "PIX 15% OFF",
        imageLocal: "img/renda3.jpeg",
        // Para usar imagem local, coloque o arquivo em /img e descomente:
        // imageLocal: "img/vestido-midi-plissado.jpg",
        colors: ["#e3dbcc"],
        sizes: ["UNICO"],
        description: "Top estruturado com bordados manuais em cristais e pérolas, combinado com uma saída em renda premium de caimento impecável."
    },
    {
        id: 2,
        name: "Look Pérola do Oriente",
        category: "blazers",
        categoryLabel: "Blazers",
        price: 237.00,
        originalPrice: 279.00,
        badge: "PIX 15% OFF",
        image: "img/renda5.jpeg",
        // imageLocal: "img/blazer-oversized.jpg",
        colors: ["#1A1A1A", "#F5F5DC", "#8B9A7D"],
        sizes: ["UNICO"],
        description: "A combinação perfeita entre a leveza da renda e a elegância, feito em conchinhas tudo feito manual bordado em conchas."
    },
    {
        id: 3,
        name: "Calça Wide Leg Cintura Alta",
        category: "calcas",
        categoryLabel: "Calças",
        price: 349.90,
        originalPrice: null,
        badge: null,
        image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80",
        // imageLocal: "img/calca-wide-leg.jpg",
        colors: ["#1A1A1A", "#F5F5DC", "#5C4033"],
        sizes: ["34", "36", "38", "40", "42", "44"],
        description: "Calça pantalona em tecido premium com caimento impecável. Cintura alta que alonga a silhueta. Versátil para looks de trabalho ou lazer."
    },

];

// Export for use in other modules if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = productsData;
}

