// components/BackendResponse.tsx
import { BackendResponse as BackendResponseType, SearchResult } from '@/types';

interface BackendResponseProps {                                                                                              
  response: BackendResponseType;                                                                                                              
}                                                                                                                             
                                                                                                                              
export default function BackendResponse({ response }: BackendResponseProps) {                                                 
    console.log(response);                                                                                                    
  return (                                                                                                                    
    <div className="space-y-6">                                                                                               
      <div className="bg-green-50 border-l-4 border-green-500 p-4">                                                           
        <div className="flex">                                                                                                
          <div className="flex-shrink-0">                                                                                     
            <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
>                                                                                                                             
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.
293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />                                                      
            </svg>                                                                                                            
          </div>                                                                                                              
          <div className="ml-3">                                                                                              
            <p className="text-sm text-green-700">                                                                            
              Search completed successfully! Found {response.totalHits || 0} companies in {response.took ? `${response.took}ms` : "unknown time"}.                                                        
            </p>                                                                                                              
          </div>                                                                                                              
        </div>                                                                                                                
      </div>                                                                                                                  
                                                                                                                              
      {/* Debug section - show raw response */}                                                                               
      <div className="border border-gray-200 rounded-lg p-4">                                                                 
        <h3 className="text-lg font-medium text-gray-900 mb-2">Debug: Raw Response</h3>                                       
        <pre className="bg-gray-800 text-gray-100 p-4 rounded-md overflow-auto text-sm font-mono">                            
          {JSON.stringify(response, null, 2)}                                                                                 
        </pre>                                                                                                                
      </div>                                                                                                                  
                                                                                                                              
      {/* Results section */}                                                                                                 
      {response.results && Array.isArray(response.results) && response.results.length > 0 ? (                                 
        <div className="space-y-4">                                                                                           
          {response.results.map((result: SearchResult, index: number) => {                                                             
            const company = result.companyDetails || result;                                                
            const classification = result.classification || {};                                                               
            const explanation = response.explanations?.[result.profileId] || '';           
            const score = result.score || 0;                                                            
                                                                                                                              
            return (                                                                                                          
              <div key={result.profileId || index} className="border border-gray-200 rounded-lg p-4">                         
                <div className="flex justify-between items-start mb-3">                                                       
                  <div>                                                                                                       
                    <h3 className="text-lg font-semibold text-gray-900">                                                      
                      {company.companyName || "Unknown Company"}                                      
                    </h3>                                                                                                     
                    <p className="text-gray-600">                                                                             
                      {company.country || "Unknown Country"} {company.city ? `• ${company.city}` : ''} {company.numberOfEmployees ? `• ${company.numberOfEmployees} employees` : ''}                                                                        
                    </p>                                                                                                      
                  </div>                                                                                                      
                  <div className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">                       
                    {Math.round(score * 100)}% match                                                                          
                  </div>                                                                                                      
                </div>                                                                                                        
                                                                                                                              
                {explanation && (                                                                                             
                  <div className="mb-4">                                                                                      
                    <h4 className="text-sm font-medium text-gray-900 mb-2">AI Explanation:</h4>                               
                    <p className="text-sm text-gray-700">{explanation}</p>                                                    
                  </div>                                                                                                      
                )}                                                                                                            
                                                                                                                              
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">                                          
                  <div>                                                                                                       
                    <h4 className="font-medium text-gray-900 mb-1">Profile Type & Services:</h4>                              
                    <div className="flex flex-wrap gap-1">                                                                    
                      {classification.profileType && (                                                                        
                        <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs">                             
                          {classification.profileType}                                                                        
                        </span>                                                                                               
                      )}                                                                                                      
                      {(classification.servicesOffered || []).slice(0, 2).map((service: string, idx: number) => (             
                        <span key={idx} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">                       
                          {service}                                                                                           
                        </span>                                                                                               
                      ))}                                                                                                     
                      {(classification.servicesOffered || []).length > 2 && (                                                 
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">                                 
                          +{(classification.servicesOffered || []).length - 2} more                                           
                        </span>                                                                                               
                      )}                                                                                                      
                    </div>                                                                                                    
                  </div>                                                                                                      
                                                                                                                              
                  <div>                                                                                                       
                    <h4 className="font-medium text-gray-900 mb-1">Keywords:</h4>                                             
                    <div className="flex flex-wrap gap-1">                                                                    
                      {(classification.keywords || []).slice(0, 3).map((keyword: string, idx: number) => (                    
                        <span key={idx} className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs">                     
                          {keyword}                                                                                           
                        </span>                                                                                               
                      ))}                                                                                                     
                      {(classification.keywords || []).length > 3 && (                                                        
                        <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs">                               
                          +{(classification.keywords || []).length - 3} more                                                  
                        </span>                                                                                               
                      )}                                                                                                      
                    </div>                                                                                                    
                  </div>                                                                                                      
                </div>                                                                                                        
                                                                                                                              
                {company.summaryOfActivity && (                                                                               
                  <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded">                                              
                    <strong>About:</strong> {company.summaryOfActivity}                                                       
                  </div>                                                                                                      
                )}                                                                                                            
              </div>                                                                                                          
            );                                                                                                                
          })}                                                                                                                 
        </div>                                                                                                                
      ) : (                                                                                                                   
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">                                                       
          <div className="flex">                                                                                              
            <div className="flex-shrink-0">                                                                                   
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentCol
or">                                                                                                                          
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98
H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1
z" clipRule="evenodd" />                                                                                                      
              </svg>                                                                                                          
            </div>                                                                                                            
            <div className="ml-3">                                                                                            
              <p className="text-sm text-yellow-700">                                                                         
                No results found or results structure is unexpected. Check the raw response above for details.                
              </p>                                                                                                            
            </div>                                                                                                            
          </div>                                                                                                              
        </div>                                                                                                                
      )}                                                                                                                      
    </div>                                                                                                                    
  );                                                                                                                          
}