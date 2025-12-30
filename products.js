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
        category: "praia",
        categoryLabel: "Praia",
        price: 237.00,
        originalPrice: 279.00,
        badge: "PIX 15% OFF",
        image: "img/renda5.jpeg",
        // imageLocal: "img/blazer-oversized.jpg",
        colors: ["#F2E7D3"],
        sizes: ["UNICO"],
        description: "A combinação perfeita entre a leveza da renda e a elegância, feito em conchinhas tudo feito manual bordado em conchas."
    },
    {
        id: 3,
        name: "Conjunto Glow Off-White",
        category: "praia",
        categoryLabel: "Praia",
        price: 189.00,
        originalPrice: 237.00,
        badge: "PIX 20% OFF",
        image: "img/renda6.jpeg",
        // imageLocal: "img/calca-wide-leg.jpg",
        colors: ["#e3dbcc"],
        sizes: ["UNICO"],
        description: "Conjunto composto por biquíni ricamente detalhado com aplicações e saída de praia em renda premium."
    },

];

// Export for use in other modules if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = productsData;
}

