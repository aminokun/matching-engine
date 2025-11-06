// components/FilterPanel.tsx
interface FilterPanelProps {                                                                                                  
  selectedFilters: Record<string, string[]>;                                                                                  
  onFilterChange: (filterKey: string, value: string) => void;                                                                 
}                                                                                                                             
                                                                                                                              
export default function FilterPanel({ selectedFilters, onFilterChange }: FilterPanelProps) {                                  
  const filterOptions = [                                                                                                     
    {                                                                                                                         
      title: "Country",                                                                                                       
      key: "country",                                                                                                         
      options: ["Germany", "Netherlands", "Belgium", "France", "Austria"]                                                     
    },                                                                                                                        
    {                                                                                                                         
      title: "Legal Structure",                                                                                               
      key: "legal_structure",                                                                                                 
      options: ["GmbH", "AG", "Ltd", "BV", "SAS"]                                                                             
    },                                                                                                                        
    {                                                                                                                         
      title: "Operating Regions",                                                                                             
      key: "operating_regions",                                                                                               
      options: ["NRW", "Hamburg", "Frankfurt", "Stuttgart", "Leipzig", "Berlin", "Munich"]                                    
    },                                                                                                                        
    {                                                                                                                         
      title: "Business Activities",                                                                                           
      key: "keywords_activity",                                                                                               
      options: [                                                                                                              
        "Großhandel Veranstaltungstechnik",                                                                                   
        "Großhändler Lichttechnik",                                                                                           
        "Großhandel Bühnentechnik",                                                                                           
        "Großhändler Tontechnik"                                                                                              
      ]                                                                                                                       
    },                                                                                                                        
    {                                                                                                                         
      title: "Product Categories",                                                                                            
      key: "business_model.product_categories",                                                                               
      options: ["Lighting", "Sound", "Staging", "Rigging", "Cables", "Accessories"]                                           
    },                                                                                                                        
    {                                                                                                                         
      title: "Client Types Served",                                                                                           
      key: "client_types_served",                                                                                             
      options: [                                                                                                              
        "Small rental companies",                                                                                             
        "Installers (schools, clubs, houses of worship)",                                                                     
        "Integrators (bigger projects)",                                                                                      
        "Local music stores / retailers"                                                                                      
      ]                                                                                                                       
    },                                                                                                                        
    {                                                                                                                         
      title: "Online Shop",                                                                                                   
      key: "business_model.online_shop",                                                                                      
      options: ["Yes", "No"]                                                                                                  
    },                                                                                                                        
    {                                                                                                                         
      title: "Target Segment",                                                                                                
      key: "business_model.target_segment",                                                                                   
      options: ["Professional B2B", "Consumer", "Prosumer"]                                                                   
    }                                                                                                                         
  ];                                                                                                                          
                                                                                                                              
  return (                                                                                                                    
    <div className="space-y-6">                                                                                               
      <h3 className="text-lg font-medium text-gray-900">Filters</h3>                                                          
                                                                                                                              
      {filterOptions.map((filter) => (                                                                                        
        <div key={filter.key} className="border-b border-gray-200 pb-4">                                                      
          <h4 className="text-sm font-medium text-gray-900 mb-2">{filter.title}</h4>                                          
          <div className="space-y-2">                                                                                         
            {filter.options.map((option) => {                                                                                 
              const isSelected = selectedFilters[filter.key]?.includes(option) || false;                                      
                                                                                                                              
              return (                                                                                                        
                <div key={option} className="flex items-center">                                                              
                  <input                                                                                                      
                    id={`${filter.key}-${option}`}                                                                            
                    name={`${filter.key}-${option}`}                                                                          
                    type="checkbox"                                                                                           
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"                             
                    checked={isSelected}                                                                                      
                    onChange={() => onFilterChange(filter.key, option)}                                                       
                  />                                                                                                          
                  <label                                                                                                      
                    htmlFor={`${filter.key}-${option}`}                                                                       
                    className="ml-3 text-sm text-gray-700"                                                                    
                  >                                                                                                           
                    {option}                                                                                                  
                  </label>                                                                                                    
                </div>                                                                                                        
              );                                                                                                              
            })}                                                                                                               
          </div>                                                                                                              
        </div>                                                                                                                
      ))}                                                                                                                     
                                                                                                                              
      <button                                                                                                                 
        onClick={() => {                                                                                                      
          // Reset all filters                                                                                                
          Object.keys(selectedFilters).forEach(key => {                                                                       
            selectedFilters[key].forEach(value => {                                                                           
              onFilterChange(key, value);                                                                                     
            });                                                                                                               
          });                                                                                                                 
        }}                                                                                                                    
        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 
hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"                                    
      >                                                                                                                       
        Reset Filters                                                                                                         
      </button>                                                                                                               
    </div>                                                                                                                    
  );                                                                                                                          
}