// components/CompanyCard.tsx
import { Company } from '@/types';

interface CompanyCardProps {
  company: Company;
}

export default function CompanyCard({ company }: CompanyCardProps) {
  const { company: data } = company;
  
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{data.company_name}</h3>
          <p className="text-gray-600">{data.country} • {data.legal_structure}</p>
        </div>
        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
          {data.employee_count_range.min}-{data.employee_count_range.max} employees
        </span>
      </div>
      
      <div className="mt-4">
        <div className="flex flex-wrap gap-2 mb-3">
          {data.operating_regions.slice(0, 3).map((region, index) => (
            <span key={index} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
              {region}
            </span>
          ))}
          {data.operating_regions.length > 3 && (
            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
              +{data.operating_regions.length - 3} more
            </span>
          )}
        </div>
        
        <div className="mt-3">
          <h4 className="text-sm font-medium text-gray-900 mb-1">Business Activities:</h4>
          <div className="flex flex-wrap gap-1">
            {data.keywords_activity.slice(0, 3).map((keyword, index) => (
              <span key={index} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                {keyword}
              </span>
            ))}
            {data.keywords_activity.length > 3 && (
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                +{data.keywords_activity.length - 3} more
              </span>
            )}
          </div>
        </div>
        
        <div className="mt-3">
          <h4 className="text-sm font-medium text-gray-900 mb-1">Product Categories:</h4>
          <div className="flex flex-wrap gap-1">
            {data.business_model.product_categories.slice(0, 3).map((category, index) => (
              <span key={index} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                {category}
              </span>
            ))}
            {data.business_model.product_categories.length > 3 && (
              <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                +{data.business_model.product_categories.length - 3} more
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}