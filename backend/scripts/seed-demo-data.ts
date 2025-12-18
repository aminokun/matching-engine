import { Client } from '@opensearch-project/opensearch';
import * as dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  node: process.env.OPENSEARCH_URL || 'http://192.168.189.161:9200',
  ssl: {
    rejectUnauthorized: false,
  },
});

const INDEX_NAME = process.env.OPENSEARCH_INDEX || 'company-profiles';

interface CompanyData {
  profileId: string;
  ingestionDate: string;
  source: string;
  companyDetails: {
    companyName: string;
    country: string;
    city: string;
    summaryOfActivity: string;
    dateEstablished: string;
    numberOfEmployees: number;
    annualTurnover: number;
    website: string;
    linkedinPage: string;
    telephone: string;
    generalEmail: string;
  };
  classification: {
    profileType: string;
    marketSegment: string;
    keywords: string[];
    servicesOffered: string[];
    clientTypesServed: string[];
  };
  primaryContact: {
    firstName: string;
    lastName: string;
    jobTitle: string;
    gender: string;
    email: string;
    telephone: string;
    linkedinPage: string;
    type: string;
  };
}

// Sample data for diverse companies
const companies: Omit<CompanyData, 'profileId' | 'ingestionDate'>[] = [
  // Electronics Distributors
  {
    source: 'DEMO',
    companyDetails: {
      companyName: 'TechFlow Distribution Ltd',
      country: 'China',
      city: 'Shenzhen',
      summaryOfActivity: 'Leading distributor of consumer electronics and IT equipment across Asia Pacific',
      dateEstablished: '2010-01-15',
      numberOfEmployees: 450,
      annualTurnover: 125000000,
      website: 'https://techflow-dist.cn',
      linkedinPage: 'https://linkedin.com/company/techflow-distribution',
      telephone: '+86-755-2233-4455',
      generalEmail: 'info@techflow-dist.cn',
    },
    classification: {
      profileType: 'Distributor',
      marketSegment: 'Electronics',
      keywords: ['electronics', 'IT equipment', 'semiconductors', 'distribution'],
      servicesOffered: ['Wholesale Distribution', 'Logistics', 'Inventory Management'],
      clientTypesServed: ['Retailers', 'System Integrators', 'Resellers'],
    },
    primaryContact: {
      firstName: 'Wei',
      lastName: 'Chen',
      jobTitle: 'Sales Director',
      gender: 'Male',
      email: 'w.chen@techflow-dist.cn',
      telephone: '+86-755-2233-4455',
      linkedinPage: 'https://linkedin.com/in/weiChen',
      type: 'Sales',
    },
  },
  {
    source: 'DEMO',
    companyDetails: {
      companyName: 'ElectroHub Germany',
      country: 'Germany',
      city: 'Munich',
      summaryOfActivity: 'European electronics distributor specializing in industrial components',
      dateEstablished: '2008-06-20',
      numberOfEmployees: 280,
      annualTurnover: 95000000,
      website: 'https://electrohub.de',
      linkedinPage: 'https://linkedin.com/company/electrohub-germany',
      telephone: '+49-89-5544-1234',
      generalEmail: 'contact@electrohub.de',
    },
    classification: {
      profileType: 'Distributor',
      marketSegment: 'Industrial Electronics',
      keywords: ['industrial components', 'electronics', 'automation', 'control systems'],
      servicesOffered: ['Distribution', 'Technical Support', 'Warehousing'],
      clientTypesServed: ['Manufacturers', 'System Integrators'],
    },
    primaryContact: {
      firstName: 'Klaus',
      lastName: 'Mueller',
      jobTitle: 'Managing Director',
      gender: 'Male',
      email: 'k.mueller@electrohub.de',
      telephone: '+49-89-5544-1234',
      linkedinPage: 'https://linkedin.com/in/klausmueller',
      type: 'Management',
    },
  },

  // Fashion & Textiles
  {
    source: 'DEMO',
    companyDetails: {
      companyName: 'StyleWorks Fashion Group',
      country: 'Italy',
      city: 'Milan',
      summaryOfActivity: 'Premium fashion brand and wholesaler of designer apparel',
      dateEstablished: '2005-03-10',
      numberOfEmployees: 320,
      annualTurnover: 78000000,
      website: 'https://styleworks-fashion.it',
      linkedinPage: 'https://linkedin.com/company/styleworks-fashion-group',
      telephone: '+39-02-7777-8888',
      generalEmail: 'sales@styleworks-fashion.it',
    },
    classification: {
      profileType: 'Brand',
      marketSegment: 'Fashion & Textiles',
      keywords: ['apparel', 'fashion', 'textiles', 'designer wear'],
      servicesOffered: ['Manufacturing', 'Wholesale', 'Retail'],
      clientTypesServed: ['Retailers', 'Department Stores', 'Boutiques'],
    },
    primaryContact: {
      firstName: 'Marco',
      lastName: 'Rossi',
      jobTitle: 'Commercial Manager',
      gender: 'Male',
      email: 'm.rossi@styleworks-fashion.it',
      telephone: '+39-02-7777-8888',
      linkedinPage: 'https://linkedin.com/in/marcorossi',
      type: 'Sales',
    },
  },
  {
    source: 'DEMO',
    companyDetails: {
      companyName: 'Textile Manufacturing Vietnam',
      country: 'Vietnam',
      city: 'Ho Chi Minh City',
      summaryOfActivity: 'Large-scale textile manufacturer and exporter of cotton and synthetic fabrics',
      dateEstablished: '2007-05-12',
      numberOfEmployees: 1200,
      annualTurnover: 55000000,
      website: 'https://tmv-textiles.vn',
      linkedinPage: 'https://linkedin.com/company/textile-manufacturing-vietnam',
      telephone: '+84-28-3844-5555',
      generalEmail: 'export@tmv-textiles.vn',
    },
    classification: {
      profileType: 'Manufacturer',
      marketSegment: 'Textiles',
      keywords: ['textiles', 'fabrics', 'cotton', 'synthetic materials', 'manufacturing'],
      servicesOffered: ['Manufacturing', 'Export', 'Custom Production'],
      clientTypesServed: ['Apparel Brands', 'Distributors', 'Retailers'],
    },
    primaryContact: {
      firstName: 'Linh',
      lastName: 'Nguyen',
      jobTitle: 'Export Manager',
      gender: 'Female',
      email: 'l.nguyen@tmv-textiles.vn',
      telephone: '+84-28-3844-5555',
      linkedinPage: 'https://linkedin.com/in/linhnguyen',
      type: 'Sales',
    },
  },

  // Industrial & Manufacturing
  {
    source: 'DEMO',
    companyDetails: {
      companyName: 'Precision Engineering Solutions',
      country: 'Germany',
      city: 'Stuttgart',
      summaryOfActivity: 'Industrial machinery manufacturer and supplier of precision parts',
      dateEstablished: '2001-08-25',
      numberOfEmployees: 680,
      annualTurnover: 145000000,
      website: 'https://precision-eng.de',
      linkedinPage: 'https://linkedin.com/company/precision-engineering-solutions',
      telephone: '+49-711-9876-5432',
      generalEmail: 'sales@precision-eng.de',
    },
    classification: {
      profileType: 'Manufacturer',
      marketSegment: 'Industrial Machinery',
      keywords: ['machinery', 'precision engineering', 'metal parts', 'automotive'],
      servicesOffered: ['Manufacturing', 'Engineering', 'Custom Solutions'],
      clientTypesServed: ['OEM', 'System Integrators', 'Distributors'],
    },
    primaryContact: {
      firstName: 'Hans',
      lastName: 'Schmidt',
      jobTitle: 'Sales Engineer',
      gender: 'Male',
      email: 'h.schmidt@precision-eng.de',
      telephone: '+49-711-9876-5432',
      linkedinPage: 'https://linkedin.com/in/hansschmidt',
      type: 'Sales',
    },
  },
  {
    source: 'DEMO',
    companyDetails: {
      companyName: 'Asian Industrial Supply Co',
      country: 'South Korea',
      city: 'Seoul',
      summaryOfActivity: 'Distributor of industrial equipment, spare parts, and tools',
      dateEstablished: '2006-12-01',
      numberOfEmployees: 350,
      annualTurnover: 62000000,
      website: 'https://asiaindustrialsupply.kr',
      linkedinPage: 'https://linkedin.com/company/asian-industrial-supply',
      telephone: '+82-2-1234-5678',
      generalEmail: 'info@asiaindustrialsupply.kr',
    },
    classification: {
      profileType: 'Distributor',
      marketSegment: 'Industrial Equipment',
      keywords: ['industrial equipment', 'spare parts', 'tools', 'machinery'],
      servicesOffered: ['Distribution', 'Technical Support', 'Maintenance'],
      clientTypesServed: ['Manufacturers', 'Factories', 'Maintenance Companies'],
    },
    primaryContact: {
      firstName: 'Jin',
      lastName: 'Park',
      jobTitle: 'Business Development Manager',
      gender: 'Male',
      email: 'j.park@asiaindustrialsupply.kr',
      telephone: '+82-2-1234-5678',
      linkedinPage: 'https://linkedin.com/in/jinpark',
      type: 'Sales',
    },
  },

  // FMCG & Consumer Goods
  {
    source: 'DEMO',
    companyDetails: {
      companyName: 'GlobalFoods Distribution',
      country: 'Netherlands',
      city: 'Amsterdam',
      summaryOfActivity: 'FMCG distributor for European supermarket chains',
      dateEstablished: '2003-02-14',
      numberOfEmployees: 520,
      annualTurnover: 185000000,
      website: 'https://globalfoods-dist.nl',
      linkedinPage: 'https://linkedin.com/company/globalfoods-distribution',
      telephone: '+31-20-5555-4444',
      generalEmail: 'sales@globalfoods-dist.nl',
    },
    classification: {
      profileType: 'Distributor',
      marketSegment: 'FMCG',
      keywords: ['food', 'beverages', 'consumer goods', 'FMCG', 'grocery'],
      servicesOffered: ['Distribution', 'Logistics', 'Retail Support'],
      clientTypesServed: ['Supermarkets', 'Retailers', 'Convenience Stores'],
    },
    primaryContact: {
      firstName: 'Peter',
      lastName: 'Van Der Berg',
      jobTitle: 'Sales Manager',
      gender: 'Male',
      email: 'p.vandenberg@globalfoods-dist.nl',
      telephone: '+31-20-5555-4444',
      linkedinPage: 'https://linkedin.com/in/petervandberg',
      type: 'Sales',
    },
  },
  {
    source: 'DEMO',
    companyDetails: {
      companyName: 'Fresh Produce Exports India',
      country: 'India',
      city: 'Chennai',
      summaryOfActivity: 'Agricultural products exporter specializing in fresh produce and spices',
      dateEstablished: '2004-06-18',
      numberOfEmployees: 290,
      annualTurnover: 38000000,
      website: 'https://freshproduce-india.com',
      linkedinPage: 'https://linkedin.com/company/fresh-produce-exports-india',
      telephone: '+91-44-4444-3333',
      generalEmail: 'export@freshproduce-india.com',
    },
    classification: {
      profileType: 'Exporter',
      marketSegment: 'Agriculture',
      keywords: ['agriculture', 'produce', 'spices', 'export', 'organic'],
      servicesOffered: ['Export', 'Processing', 'Quality Assurance'],
      clientTypesServed: ['Importers', 'Distributors', 'Retailers'],
    },
    primaryContact: {
      firstName: 'Rajesh',
      lastName: 'Kumar',
      jobTitle: 'Export Director',
      gender: 'Male',
      email: 'r.kumar@freshproduce-india.com',
      telephone: '+91-44-4444-3333',
      linkedinPage: 'https://linkedin.com/in/rajeshkumar',
      type: 'Sales',
    },
  },

  // Retail & E-commerce
  {
    source: 'DEMO',
    companyDetails: {
      companyName: 'MegaStore Retail UK',
      country: 'United Kingdom',
      city: 'London',
      summaryOfActivity: 'Multi-channel retailer with both physical stores and online presence',
      dateEstablished: '2009-04-20',
      numberOfEmployees: 1850,
      annualTurnover: 245000000,
      website: 'https://megastore-retail.co.uk',
      linkedinPage: 'https://linkedin.com/company/megastore-retail-uk',
      telephone: '+44-20-7777-8888',
      generalEmail: 'customer@megastore-retail.co.uk',
    },
    classification: {
      profileType: 'Retailer',
      marketSegment: 'General Merchandise',
      keywords: ['retail', 'e-commerce', 'consumer goods', 'electronics', 'fashion'],
      servicesOffered: ['Retail', 'E-commerce', 'Customer Service'],
      clientTypesServed: ['End Consumers', 'B2B'],
    },
    primaryContact: {
      firstName: 'James',
      lastName: 'Thompson',
      jobTitle: 'Procurement Manager',
      gender: 'Male',
      email: 'j.thompson@megastore-retail.co.uk',
      telephone: '+44-20-7777-8888',
      linkedinPage: 'https://linkedin.com/in/jamesthompson',
      type: 'Procurement',
    },
  },
  {
    source: 'DEMO',
    companyDetails: {
      companyName: 'Urban Fashion Boutique',
      country: 'France',
      city: 'Paris',
      summaryOfActivity: 'Fashion retailer specializing in contemporary apparel and accessories',
      dateEstablished: '2011-09-08',
      numberOfEmployees: 125,
      annualTurnover: 28000000,
      website: 'https://urbanfashion-paris.fr',
      linkedinPage: 'https://linkedin.com/company/urban-fashion-boutique',
      telephone: '+33-1-4567-8901',
      generalEmail: 'info@urbanfashion-paris.fr',
    },
    classification: {
      profileType: 'Retailer',
      marketSegment: 'Fashion',
      keywords: ['fashion', 'apparel', 'accessories', 'boutique', 'contemporary'],
      servicesOffered: ['Retail', 'Personal Shopping', 'Styling'],
      clientTypesServed: ['End Consumers'],
    },
    primaryContact: {
      firstName: 'Sophie',
      lastName: 'Dubois',
      jobTitle: 'Store Manager',
      gender: 'Female',
      email: 's.dubois@urbanfashion-paris.fr',
      telephone: '+33-1-4567-8901',
      linkedinPage: 'https://linkedin.com/in/sophiedubois',
      type: 'Management',
    },
  },

  // Chemical & Pharmaceutical
  {
    source: 'DEMO',
    companyDetails: {
      companyName: 'ChemCorp Industries',
      country: 'Belgium',
      city: 'Antwerp',
      summaryOfActivity: 'Chemical manufacturer and distributor of industrial chemicals',
      dateEstablished: '2000-01-10',
      numberOfEmployees: 580,
      annualTurnover: 168000000,
      website: 'https://chemcorp-industries.be',
      linkedinPage: 'https://linkedin.com/company/chemcorp-industries',
      telephone: '+32-3-2222-1111',
      generalEmail: 'sales@chemcorp-industries.be',
    },
    classification: {
      profileType: 'Manufacturer',
      marketSegment: 'Chemicals',
      keywords: ['chemicals', 'industrial chemicals', 'pharmaceuticals', 'manufacturing'],
      servicesOffered: ['Manufacturing', 'Distribution', 'Custom Synthesis'],
      clientTypesServed: ['Manufacturers', 'Pharmaceutical Companies', 'Distributors'],
    },
    primaryContact: {
      firstName: 'Filip',
      lastName: 'Hermans',
      jobTitle: 'Sales Director',
      gender: 'Male',
      email: 'f.hermans@chemcorp-industries.be',
      telephone: '+32-3-2222-1111',
      linkedinPage: 'https://linkedin.com/in/filiphermans',
      type: 'Sales',
    },
  },

  // Logistics & Transport
  {
    source: 'DEMO',
    companyDetails: {
      companyName: 'Express Logistics International',
      country: 'Singapore',
      city: 'Singapore',
      summaryOfActivity: 'Third-party logistics provider with regional hub in Southeast Asia',
      dateEstablished: '2006-03-22',
      numberOfEmployees: 420,
      annualTurnover: 95000000,
      website: 'https://expresslogistics-intl.sg',
      linkedinPage: 'https://linkedin.com/company/express-logistics-international',
      telephone: '+65-6666-7777',
      generalEmail: 'enquiry@expresslogistics-intl.sg',
    },
    classification: {
      profileType: 'Distributor',
      marketSegment: 'Logistics',
      keywords: ['logistics', 'supply chain', 'transportation', 'warehousing', 'distribution'],
      servicesOffered: ['3PL Services', 'Warehousing', 'Transportation'],
      clientTypesServed: ['Manufacturers', 'Distributors', 'E-commerce Companies'],
    },
    primaryContact: {
      firstName: 'David',
      lastName: 'Tan',
      jobTitle: 'Operations Manager',
      gender: 'Male',
      email: 'd.tan@expresslogistics-intl.sg',
      telephone: '+65-6666-7777',
      linkedinPage: 'https://linkedin.com/in/davidtan',
      type: 'Operations',
    },
  },

  // Automotive & Parts
  {
    source: 'DEMO',
    companyDetails: {
      companyName: 'AutoParts Premium',
      country: 'Japan',
      city: 'Tokyo',
      summaryOfActivity: 'Manufacturer and distributor of premium automotive parts and components',
      dateEstablished: '2002-07-15',
      numberOfEmployees: 890,
      annualTurnover: 205000000,
      website: 'https://autoparts-premium.jp',
      linkedinPage: 'https://linkedin.com/company/autoparts-premium',
      telephone: '+81-3-1234-5678',
      generalEmail: 'sales@autoparts-premium.jp',
    },
    classification: {
      profileType: 'Manufacturer',
      marketSegment: 'Automotive',
      keywords: ['automotive', 'parts', 'components', 'OEM', 'manufacturing'],
      servicesOffered: ['Manufacturing', 'Distribution', 'Quality Control'],
      clientTypesServed: ['Car Manufacturers', 'Distributors', 'Repair Shops'],
    },
    primaryContact: {
      firstName: 'Takeshi',
      lastName: 'Yamamoto',
      jobTitle: 'Business Development',
      gender: 'Male',
      email: 't.yamamoto@autoparts-premium.jp',
      telephone: '+81-3-1234-5678',
      linkedinPage: 'https://linkedin.com/in/takeshiyamamoto',
      type: 'Sales',
    },
  },
  {
    source: 'DEMO',
    companyDetails: {
      companyName: 'European Auto Supplies',
      country: 'Poland',
      city: 'Warsaw',
      summaryOfActivity: 'Aftermarket automotive supplies distributor for European market',
      dateEstablished: '2008-11-03',
      numberOfEmployees: 215,
      annualTurnover: 42000000,
      website: 'https://euroautosupplies.pl',
      linkedinPage: 'https://linkedin.com/company/european-auto-supplies',
      telephone: '+48-22-1111-2222',
      generalEmail: 'info@euroautosupplies.pl',
    },
    classification: {
      profileType: 'Distributor',
      marketSegment: 'Automotive',
      keywords: ['automotive', 'aftermarket', 'parts', 'accessories', 'distribution'],
      servicesOffered: ['Distribution', 'Retail', 'Installation Support'],
      clientTypesServed: ['Auto Shops', 'Retailers', 'Garages'],
    },
    primaryContact: {
      firstName: 'Andrzej',
      lastName: 'Kowalski',
      jobTitle: 'Sales Director',
      gender: 'Male',
      email: 'a.kowalski@euroautosupplies.pl',
      telephone: '+48-22-1111-2222',
      linkedinPage: 'https://linkedin.com/in/andrzejkowalski',
      type: 'Sales',
    },
  },

  // Beauty & Cosmetics
  {
    source: 'DEMO',
    companyDetails: {
      companyName: 'Beauty & Wellness Global',
      country: 'South Korea',
      city: 'Busan',
      summaryOfActivity: 'Cosmetics and beauty products manufacturer and exporter',
      dateEstablished: '2005-05-12',
      numberOfEmployees: 410,
      annualTurnover: 76000000,
      website: 'https://beautyandwellness.kr',
      linkedinPage: 'https://linkedin.com/company/beauty-and-wellness-global',
      telephone: '+82-51-2222-3333',
      generalEmail: 'export@beautyandwellness.kr',
    },
    classification: {
      profileType: 'Manufacturer',
      marketSegment: 'Beauty & Cosmetics',
      keywords: ['cosmetics', 'beauty', 'skincare', 'wellness', 'manufacturing'],
      servicesOffered: ['Manufacturing', 'Contract Manufacturing', 'Export'],
      clientTypesServed: ['Brands', 'Distributors', 'Retailers'],
    },
    primaryContact: {
      firstName: 'Mi-Sun',
      lastName: 'Lee',
      jobTitle: 'Export Manager',
      gender: 'Female',
      email: 'm.lee@beautyandwellness.kr',
      telephone: '+82-51-2222-3333',
      linkedinPage: 'https://linkedin.com/in/misunlee',
      type: 'Sales',
    },
  },

  // Furniture & Home Goods
  {
    source: 'DEMO',
    companyDetails: {
      companyName: 'Scandinavian Furniture Co',
      country: 'Denmark',
      city: 'Copenhagen',
      summaryOfActivity: 'Designer furniture manufacturer and wholesaler',
      dateEstablished: '2007-02-10',
      numberOfEmployees: 310,
      annualTurnover: 58000000,
      website: 'https://scandfurniture.dk',
      linkedinPage: 'https://linkedin.com/company/scandinavian-furniture-co',
      telephone: '+45-33-1111-2222',
      generalEmail: 'sales@scandfurniture.dk',
    },
    classification: {
      profileType: 'Manufacturer',
      marketSegment: 'Furniture',
      keywords: ['furniture', 'home decor', 'design', 'manufacturing', 'wholesale'],
      servicesOffered: ['Manufacturing', 'Design', 'Wholesale Distribution'],
      clientTypesServed: ['Interior Designers', 'Retailers', 'Hotels'],
    },
    primaryContact: {
      firstName: 'Erik',
      lastName: 'Andersen',
      jobTitle: 'Sales Manager',
      gender: 'Male',
      email: 'e.andersen@scandfurniture.dk',
      telephone: '+45-33-1111-2222',
      linkedinPage: 'https://linkedin.com/in/erikandersen',
      type: 'Sales',
    },
  },

  // Electronics Manufacturing
  {
    source: 'DEMO',
    companyDetails: {
      companyName: 'TechManufacturing Taiwan',
      country: 'Taiwan',
      city: 'Taipei',
      summaryOfActivity: 'OEM/ODM manufacturer of consumer electronics',
      dateEstablished: '2003-08-20',
      numberOfEmployees: 1450,
      annualTurnover: 285000000,
      website: 'https://techmanuf-taiwan.tw',
      linkedinPage: 'https://linkedin.com/company/techmanufacturing-taiwan',
      telephone: '+886-2-3344-5555',
      generalEmail: 'sales@techmanuf-taiwan.tw',
    },
    classification: {
      profileType: 'Manufacturer',
      marketSegment: 'Electronics',
      keywords: ['electronics', 'manufacturing', 'OEM', 'ODM', 'components'],
      servicesOffered: ['OEM Manufacturing', 'ODM Services', 'Component Supply'],
      clientTypesServed: ['Electronics Brands', 'Distributors'],
    },
    primaryContact: {
      firstName: 'Chen',
      lastName: 'Wang',
      jobTitle: 'Sales Engineer',
      gender: 'Male',
      email: 'c.wang@techmanuf-taiwan.tw',
      telephone: '+886-2-3344-5555',
      linkedinPage: 'https://linkedin.com/in/chenwang',
      type: 'Sales',
    },
  },

  // Additional diverse companies
  {
    source: 'DEMO',
    companyDetails: {
      companyName: 'Packaging Solutions Global',
      country: 'Mexico',
      city: 'Mexico City',
      summaryOfActivity: 'Manufacturer of packaging materials and containers',
      dateEstablished: '2006-04-18',
      numberOfEmployees: 380,
      annualTurnover: 52000000,
      website: 'https://packaging-solutions-mx.com',
      linkedinPage: 'https://linkedin.com/company/packaging-solutions-global',
      telephone: '+52-55-3333-4444',
      generalEmail: 'sales@packaging-solutions-mx.com',
    },
    classification: {
      profileType: 'Manufacturer',
      marketSegment: 'Packaging',
      keywords: ['packaging', 'containers', 'boxes', 'materials', 'manufacturing'],
      servicesOffered: ['Manufacturing', 'Custom Design', 'Supply Chain Management'],
      clientTypesServed: ['FMCG Companies', 'Electronics Manufacturers', 'Pharmaceutical'],
    },
    primaryContact: {
      firstName: 'Carlos',
      lastName: 'Garcia',
      jobTitle: 'Business Manager',
      gender: 'Male',
      email: 'c.garcia@packaging-solutions-mx.com',
      telephone: '+52-55-3333-4444',
      linkedinPage: 'https://linkedin.com/in/carlosgarcia',
      type: 'Sales',
    },
  },
  {
    source: 'DEMO',
    companyDetails: {
      companyName: 'Energy Solutions International',
      country: 'Denmark',
      city: 'Aarhus',
      summaryOfActivity: 'Renewable energy equipment distributor and installer',
      dateEstablished: '2010-09-15',
      numberOfEmployees: 195,
      annualTurnover: 35000000,
      website: 'https://energysolutions-intl.dk',
      linkedinPage: 'https://linkedin.com/company/energy-solutions-international',
      telephone: '+45-89-5555-6666',
      generalEmail: 'info@energysolutions-intl.dk',
    },
    classification: {
      profileType: 'Distributor',
      marketSegment: 'Energy',
      keywords: ['renewable energy', 'solar', 'wind', 'distribution', 'installation'],
      servicesOffered: ['Distribution', 'Installation', 'Technical Support'],
      clientTypesServed: ['Construction Companies', 'Developers', 'Facilities'],
    },
    primaryContact: {
      firstName: 'Bjorn',
      lastName: 'Jensen',
      jobTitle: 'Technical Director',
      gender: 'Male',
      email: 'b.jensen@energysolutions-intl.dk',
      telephone: '+45-89-5555-6666',
      linkedinPage: 'https://linkedin.com/in/bjournjensen',
      type: 'Sales',
    },
  },
  {
    source: 'DEMO',
    companyDetails: {
      companyName: 'Medical Device Supply Co',
      country: 'Switzerland',
      city: 'Zurich',
      summaryOfActivity: 'Distributor of medical devices and healthcare equipment',
      dateEstablished: '2004-10-22',
      numberOfEmployees: 220,
      annualTurnover: 65000000,
      website: 'https://medicaldevice-supply.ch',
      linkedinPage: 'https://linkedin.com/company/medical-device-supply-co',
      telephone: '+41-44-4444-5555',
      generalEmail: 'info@medicaldevice-supply.ch',
    },
    classification: {
      profileType: 'Distributor',
      marketSegment: 'Healthcare',
      keywords: ['medical devices', 'healthcare', 'equipment', 'distribution', 'hospitals'],
      servicesOffered: ['Distribution', 'Technical Training', 'Support'],
      clientTypesServed: ['Hospitals', 'Clinics', 'Medical Facilities'],
    },
    primaryContact: {
      firstName: 'Thomas',
      lastName: 'Mueller',
      jobTitle: 'Sales Manager',
      gender: 'Male',
      email: 't.mueller@medicaldevice-supply.ch',
      telephone: '+41-44-4444-5555',
      linkedinPage: 'https://linkedin.com/in/thomasmueller',
      type: 'Sales',
    },
  },
  {
    source: 'DEMO',
    companyDetails: {
      companyName: 'Construction Materials Supply',
      country: 'Brazil',
      city: 'Sao Paulo',
      summaryOfActivity: 'Distributor of construction materials and building supplies',
      dateEstablished: '2005-01-08',
      numberOfEmployees: 475,
      annualTurnover: 72000000,
      website: 'https://constmaterials-br.com.br',
      linkedinPage: 'https://linkedin.com/company/construction-materials-supply',
      telephone: '+55-11-3333-4444',
      generalEmail: 'sales@constmaterials-br.com.br',
    },
    classification: {
      profileType: 'Distributor',
      marketSegment: 'Construction',
      keywords: ['construction', 'building materials', 'supplies', 'distribution'],
      servicesOffered: ['Distribution', 'Logistics', 'Retail'],
      clientTypesServed: ['Construction Companies', 'Contractors', 'Retailers'],
    },
    primaryContact: {
      firstName: 'Fernando',
      lastName: 'Silva',
      jobTitle: 'Operations Manager',
      gender: 'Male',
      email: 'f.silva@constmaterials-br.com.br',
      telephone: '+55-11-3333-4444',
      linkedinPage: 'https://linkedin.com/in/fernandosilva',
      type: 'Operations',
    },
  },
  {
    source: 'DEMO',
    companyDetails: {
      companyName: 'Agricultural Equipment India',
      country: 'India',
      city: 'Bangalore',
      summaryOfActivity: 'Manufacturer and distributor of agricultural machinery',
      dateEstablished: '2008-06-12',
      numberOfEmployees: 320,
      annualTurnover: 44000000,
      website: 'https://agri-equipment-india.com',
      linkedinPage: 'https://linkedin.com/company/agricultural-equipment-india',
      telephone: '+91-80-2222-3333',
      generalEmail: 'sales@agri-equipment-india.com',
    },
    classification: {
      profileType: 'Manufacturer',
      marketSegment: 'Agriculture',
      keywords: ['agriculture', 'machinery', 'farming equipment', 'tractors'],
      servicesOffered: ['Manufacturing', 'Distribution', 'Service & Support'],
      clientTypesServed: ['Farmers', 'Distributors', 'Agricultural Companies'],
    },
    primaryContact: {
      firstName: 'Vikram',
      lastName: 'Singh',
      jobTitle: 'Sales Director',
      gender: 'Male',
      email: 'v.singh@agri-equipment-india.com',
      telephone: '+91-80-2222-3333',
      linkedinPage: 'https://linkedin.com/in/vikramsingh',
      type: 'Sales',
    },
  },
  {
    source: 'DEMO',
    companyDetails: {
      companyName: 'Beverage Distributor Thailand',
      country: 'Thailand',
      city: 'Bangkok',
      summaryOfActivity: 'Beverage distributor for major brands across Southeast Asia',
      dateEstablished: '2009-03-20',
      numberOfEmployees: 480,
      annualTurnover: 85000000,
      website: 'https://beverage-dist-thailand.co.th',
      linkedinPage: 'https://linkedin.com/company/beverage-distributor-thailand',
      telephone: '+66-2-4444-5555',
      generalEmail: 'sales@beverage-dist-thailand.co.th',
    },
    classification: {
      profileType: 'Distributor',
      marketSegment: 'FMCG',
      keywords: ['beverages', 'drinks', 'distribution', 'FMCG', 'wholesale'],
      servicesOffered: ['Distribution', 'Logistics', 'Retail Support'],
      clientTypesServed: ['Retailers', 'Convenience Stores', 'Hotels'],
    },
    primaryContact: {
      firstName: 'Somchai',
      lastName: 'Phadej',
      jobTitle: 'Commercial Director',
      gender: 'Male',
      email: 's.phadej@beverage-dist-thailand.co.th',
      telephone: '+66-2-4444-5555',
      linkedinPage: 'https://linkedin.com/in/somchaiphadej',
      type: 'Sales',
    },
  },
  {
    source: 'DEMO',
    companyDetails: {
      companyName: 'Electronics Wholesale USA',
      country: 'United States',
      city: 'Los Angeles',
      summaryOfActivity: 'Electronics wholesaler serving retailers across North America',
      dateEstablished: '2006-07-18',
      numberOfEmployees: 625,
      annualTurnover: 155000000,
      website: 'https://electronics-wholesale-usa.com',
      linkedinPage: 'https://linkedin.com/company/electronics-wholesale-usa',
      telephone: '+1-213-5555-6666',
      generalEmail: 'info@electronics-wholesale-usa.com',
    },
    classification: {
      profileType: 'Distributor',
      marketSegment: 'Electronics',
      keywords: ['electronics', 'wholesale', 'computers', 'distribution'],
      servicesOffered: ['Wholesale Distribution', 'Logistics', 'Product Support'],
      clientTypesServed: ['Retailers', 'System Integrators', 'Resellers'],
    },
    primaryContact: {
      firstName: 'Michael',
      lastName: 'Johnson',
      jobTitle: 'National Sales Manager',
      gender: 'Male',
      email: 'm.johnson@electronics-wholesale-usa.com',
      telephone: '+1-213-5555-6666',
      linkedinPage: 'https://linkedin.com/in/michaeljohnson',
      type: 'Sales',
    },
  },
  {
    source: 'DEMO',
    companyDetails: {
      companyName: 'Apparel Factory China',
      country: 'China',
      city: 'Guangzhou',
      summaryOfActivity: 'Large-scale apparel manufacturing facility with OEM capabilities',
      dateEstablished: '2002-05-15',
      numberOfEmployees: 2100,
      annualTurnover: 138000000,
      website: 'https://apparelfactory-china.com',
      linkedinPage: 'https://linkedin.com/company/apparel-factory-china',
      telephone: '+86-20-1234-5678',
      generalEmail: 'sales@apparelfactory-china.com',
    },
    classification: {
      profileType: 'Manufacturer',
      marketSegment: 'Textiles',
      keywords: ['apparel', 'clothing', 'manufacturing', 'OEM', 'textiles'],
      servicesOffered: ['OEM Manufacturing', 'Design Consultation', 'Quality Control'],
      clientTypesServed: ['Fashion Brands', 'Retailers', 'Wholesalers'],
    },
    primaryContact: {
      firstName: 'Zhang',
      lastName: 'Li',
      jobTitle: 'Export Sales Manager',
      gender: 'Male',
      email: 'z.li@apparelfactory-china.com',
      telephone: '+86-20-1234-5678',
      linkedinPage: 'https://linkedin.com/in/zhangli',
      type: 'Sales',
    },
  },
  {
    source: 'DEMO',
    companyDetails: {
      companyName: 'Office Furniture World',
      country: 'Canada',
      city: 'Toronto',
      summaryOfActivity: 'Office furniture distributor and retailer for commercial spaces',
      dateEstablished: '2008-11-10',
      numberOfEmployees: 280,
      annualTurnover: 48000000,
      website: 'https://officefurniture-world.ca',
      linkedinPage: 'https://linkedin.com/company/office-furniture-world',
      telephone: '+1-416-4444-5555',
      generalEmail: 'sales@officefurniture-world.ca',
    },
    classification: {
      profileType: 'Distributor',
      marketSegment: 'Furniture',
      keywords: ['office furniture', 'commercial', 'furniture', 'distribution'],
      servicesOffered: ['Distribution', 'Installation', 'Interior Design Consultation'],
      clientTypesServed: ['Corporations', 'Office Designers', 'Retailers'],
    },
    primaryContact: {
      firstName: 'Sarah',
      lastName: 'Williams',
      jobTitle: 'Sales Manager',
      gender: 'Female',
      email: 's.williams@officefurniture-world.ca',
      telephone: '+1-416-4444-5555',
      linkedinPage: 'https://linkedin.com/in/sarahwilliams',
      type: 'Sales',
    },
  },
  {
    source: 'DEMO',
    companyDetails: {
      companyName: 'Industrial Cleaning Solutions',
      country: 'Netherlands',
      city: 'Rotterdam',
      summaryOfActivity: 'Manufacturer of industrial cleaning products and supplies',
      dateEstablished: '2007-02-14',
      numberOfEmployees: 210,
      annualTurnover: 32000000,
      website: 'https://indclean-solutions.nl',
      linkedinPage: 'https://linkedin.com/company/industrial-cleaning-solutions',
      telephone: '+31-10-6666-7777',
      generalEmail: 'sales@indclean-solutions.nl',
    },
    classification: {
      profileType: 'Manufacturer',
      marketSegment: 'Industrial',
      keywords: ['cleaning products', 'industrial', 'chemicals', 'manufacturing'],
      servicesOffered: ['Manufacturing', 'Distribution', 'Custom Formulation'],
      clientTypesServed: ['Industrial Facilities', 'Distributors', 'Cleaning Companies'],
    },
    primaryContact: {
      firstName: 'Bert',
      lastName: 'Jansen',
      jobTitle: 'Sales Executive',
      gender: 'Male',
      email: 'b.jansen@indclean-solutions.nl',
      telephone: '+31-10-6666-7777',
      linkedinPage: 'https://linkedin.com/in/bertjansen',
      type: 'Sales',
    },
  },
  {
    source: 'DEMO',
    companyDetails: {
      companyName: 'Sports Equipment Manufacturer',
      country: 'Indonesia',
      city: 'Jakarta',
      summaryOfActivity: 'Sports equipment and athletic wear manufacturer',
      dateEstablished: '2009-08-20',
      numberOfEmployees: 580,
      annualTurnover: 61000000,
      website: 'https://sports-equipment-mfg.id',
      linkedinPage: 'https://linkedin.com/company/sports-equipment-manufacturer',
      telephone: '+62-21-3344-5555',
      generalEmail: 'export@sports-equipment-mfg.id',
    },
    classification: {
      profileType: 'Manufacturer',
      marketSegment: 'Sports',
      keywords: ['sports equipment', 'athletic wear', 'manufacturing', 'export'],
      servicesOffered: ['Manufacturing', 'OEM Services', 'Export'],
      clientTypesServed: ['Sports Brands', 'Distributors', 'Retailers'],
    },
    primaryContact: {
      firstName: 'Budi',
      lastName: 'Santoso',
      jobTitle: 'Export Manager',
      gender: 'Male',
      email: 'b.santoso@sports-equipment-mfg.id',
      telephone: '+62-21-3344-5555',
      linkedinPage: 'https://linkedin.com/in/budisantoso',
      type: 'Sales',
    },
  },
  {
    source: 'DEMO',
    companyDetails: {
      companyName: 'Kitchen Equipment Wholesale',
      country: 'Italy',
      city: 'Bologna',
      summaryOfActivity: 'Wholesaler of kitchen equipment and appliances',
      dateEstablished: '2006-09-25',
      numberOfEmployees: 170,
      annualTurnover: 31000000,
      website: 'https://kitchen-equip-wholesale.it',
      linkedinPage: 'https://linkedin.com/company/kitchen-equipment-wholesale',
      telephone: '+39-51-7777-8888',
      generalEmail: 'info@kitchen-equip-wholesale.it',
    },
    classification: {
      profileType: 'Distributor',
      marketSegment: 'Kitchen Equipment',
      keywords: ['kitchen equipment', 'appliances', 'wholesale', 'distribution'],
      servicesOffered: ['Distribution', 'Installation Support', 'Customer Service'],
      clientTypesServed: ['Restaurants', 'Hotels', 'Retailers', 'Catering'],
    },
    primaryContact: {
      firstName: 'Antonio',
      lastName: 'Marchetti',
      jobTitle: 'Business Manager',
      gender: 'Male',
      email: 'a.marchetti@kitchen-equip-wholesale.it',
      telephone: '+39-51-7777-8888',
      linkedinPage: 'https://linkedin.com/in/antoniomarchetti',
      type: 'Sales',
    },
  },
  {
    source: 'DEMO',
    companyDetails: {
      companyName: 'Pharmaceutical Distribution Europe',
      country: 'Germany',
      city: 'Frankfurt',
      summaryOfActivity: 'Pharmaceutical distributor serving European markets',
      dateEstablished: '2003-04-10',
      numberOfEmployees: 420,
      annualTurnover: 128000000,
      website: 'https://pharma-dist-europe.de',
      linkedinPage: 'https://linkedin.com/company/pharmaceutical-distribution-europe',
      telephone: '+49-69-3333-4444',
      generalEmail: 'sales@pharma-dist-europe.de',
    },
    classification: {
      profileType: 'Distributor',
      marketSegment: 'Pharmaceuticals',
      keywords: ['pharmaceuticals', 'healthcare', 'distribution', 'medicines'],
      servicesOffered: ['Distribution', 'Logistics', 'Compliance Management'],
      clientTypesServed: ['Pharmacies', 'Hospitals', 'Healthcare Providers'],
    },
    primaryContact: {
      firstName: 'Helmut',
      lastName: 'Weber',
      jobTitle: 'Director of Sales',
      gender: 'Male',
      email: 'h.weber@pharma-dist-europe.de',
      telephone: '+49-69-3333-4444',
      linkedinPage: 'https://linkedin.com/in/helmutwebern',
      type: 'Sales',
    },
  },
];

// Generate profile IDs and add ingestion dates
const companiesWithIds: CompanyData[] = companies.map((company, index) => ({
  profileId: `PROF-${Date.now()}-${String(index).padStart(3, '0')}`,
  ingestionDate: new Date().toISOString(),
  ...company,
}));

async function seedData() {
  try {
    console.log('Starting to seed demo data...');
    console.log(`Total companies to insert: ${companiesWithIds.length}`);

    // Insert each company
    let successCount = 0;
    for (const company of companiesWithIds) {
      try {
        await client.index({
          index: INDEX_NAME,
          body: company,
        });
        successCount++;
        if (successCount % 5 === 0) {
          console.log(`Inserted ${successCount} companies...`);
        }
      } catch (error) {
        console.error(`Failed to insert company ${company.profileId}:`, error);
      }
    }

    // Refresh the index to make sure all documents are searchable
    await client.indices.refresh({ index: INDEX_NAME });

    console.log(`\n✅ Successfully inserted ${successCount} companies!`);
    console.log(`\nDemo data seeding complete!`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
