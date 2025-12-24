/**
 * ATELIER — Products Data
 * Database de produtos da loja
 */

const productsData = [
    {
        id: 1,
        name: "Vestido Midi Plissado",
        category: "vestidos",
        categoryLabel: "Vestidos",
        price: 489.90,
        originalPrice: null,
        badge: "new",
        image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=80",
        colors: ["#1A1A1A", "#8B6914", "#C4785A"],
        sizes: ["PP", "P", "M", "G", "GG"],
        description: "Vestido midi com saia plissada em tecido fluido. Corte elegante que valoriza a silhueta. Perfeito para ocasiões especiais ou para compor looks do dia a dia com sofisticação."
    },
    {
        id: 2,
        name: "Blazer Oversized Alfaiataria",
        category: "blazers",
        categoryLabel: "Blazers",
        price: 599.90,
        originalPrice: 799.90,
        badge: "sale",
        image: "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=600&q=80",
        colors: ["#1A1A1A", "#F5F5DC", "#8B9A7D"],
        sizes: ["P", "M", "G", "GG"],
        description: "Blazer oversized em alfaiataria premium. Design contemporâneo com ombros estruturados. A peça-chave para transformar qualquer look."
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
        colors: ["#1A1A1A", "#F5F5DC", "#5C4033"],
        sizes: ["34", "36", "38", "40", "42", "44"],
        description: "Calça pantalona em tecido premium com caimento impecável. Cintura alta que alonga a silhueta. Versátil para looks de trabalho ou lazer."
    },
    {
        id: 4,
        name: "Vestido Slip Dress Cetim",
        category: "vestidos",
        categoryLabel: "Vestidos",
        price: 429.90,
        originalPrice: null,
        badge: "limited",
        image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&q=80",
        colors: ["#B8860B", "#1A1A1A", "#C4785A"],
        sizes: ["PP", "P", "M", "G"],
        description: "Slip dress em cetim de seda. Alças finas ajustáveis e decote elegante. Pode ser usado sozinho ou combinado com camisetas e blazers."
    },
    {
        id: 5,
        name: "Bolsa Structured Couro",
        category: "acessorios",
        categoryLabel: "Acessórios",
        price: 699.90,
        originalPrice: null,
        badge: "new",
        image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80",
        colors: ["#1A1A1A", "#5C4033", "#F5F5DC"],
        sizes: ["Único"],
        description: "Bolsa estruturada em couro legítimo. Design atemporal com acabamento artesanal. Compartimentos internos organizadores."
    },
    {
        id: 6,
        name: "Blazer Cropped Tweed",
        category: "blazers",
        categoryLabel: "Blazers",
        price: 549.90,
        originalPrice: 689.90,
        badge: "sale",
        image: "https://images.unsplash.com/photo-1548624149-f9b872c66f54?w=600&q=80",
        colors: ["#F5F5DC", "#1A1A1A"],
        sizes: ["PP", "P", "M", "G"],
        description: "Blazer cropped em tweed premium com detalhes em botões dourados. Inspiração clássica com toque contemporâneo."
    },
    {
        id: 7,
        name: "Calça Reta Alfaiataria",
        category: "calcas",
        categoryLabel: "Calças",
        price: 389.90,
        originalPrice: null,
        badge: null,
        image: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&q=80",
        colors: ["#1A1A1A", "#5C4033", "#8B9A7D"],
        sizes: ["34", "36", "38", "40", "42"],
        description: "Calça de alfaiataria com corte reto clássico. Tecido com elastano para conforto. Ideal para ambientes corporativos."
    },
    {
        id: 8,
        name: "Cinto Fivela Dourada",
        category: "acessorios",
        categoryLabel: "Acessórios",
        price: 189.90,
        originalPrice: null,
        badge: null,
        image: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=600&q=80",
        colors: ["#1A1A1A", "#5C4033"],
        sizes: ["P", "M", "G"],
        description: "Cinto em couro legítimo com fivela dourada. Acabamento premium e durabilidade excepcional."
    },
    {
        id: 9,
        name: "Vestido Longo Fluido",
        category: "vestidos",
        categoryLabel: "Vestidos",
        price: 679.90,
        originalPrice: null,
        badge: "new",
        image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&q=80",
        colors: ["#8B9A7D", "#1A1A1A", "#C4785A"],
        sizes: ["PP", "P", "M", "G", "GG"],
        description: "Vestido longo em tecido fluido com movimento elegante. Ideal para eventos e ocasiões especiais."
    },
    {
        id: 10,
        name: "Blazer Clássico Preto",
        category: "blazers",
        categoryLabel: "Blazers",
        price: 529.90,
        originalPrice: null,
        badge: null,
        image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80",
        colors: ["#1A1A1A"],
        sizes: ["PP", "P", "M", "G", "GG"],
        description: "Blazer clássico em preto atemporal. Corte impecável e caimento perfeito. O essencial de todo guarda-roupa."
    },
    {
        id: 11,
        name: "Bolsa Crossbody Mini",
        category: "acessorios",
        categoryLabel: "Acessórios",
        price: 359.90,
        originalPrice: 449.90,
        badge: "sale",
        image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80",
        colors: ["#B8860B", "#1A1A1A", "#F5F5DC"],
        sizes: ["Único"],
        description: "Mini bolsa crossbody em couro texturizado. Alça ajustável e fechamento magnético. Perfeita para o dia a dia."
    },
    {
        id: 12,
        name: "Calça Cargo Moderna",
        category: "calcas",
        categoryLabel: "Calças",
        price: 379.90,
        originalPrice: null,
        badge: "limited",
        image: "https://images.unsplash.com/photo-1551854838-212c50b4c184?w=600&q=80",
        colors: ["#5C4033", "#8B9A7D", "#1A1A1A"],
        sizes: ["34", "36", "38", "40", "42"],
        description: "Calça cargo repaginada com design contemporâneo. Bolsos funcionais e cintura ajustável. A fusão perfeita entre utilidade e estilo."
    }
];

// Export for use in other modules if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = productsData;
}

