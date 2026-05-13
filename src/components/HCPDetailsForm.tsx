import React, { useState, useRef, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';

interface HCPDetailsFormProps {
  onBack?: () => void;
  onSubmit?: (data: FormData, existingDoctorId?: number) => void;
  isLoading?: boolean;
  error?: string;
  existingDoctors?: Array<{
    id: number;
    dr_name: string;
    registration_no: string | null;
    mobile: string | null;
    email: string | null;
    p_code: string | null;
    city: string;
    pledge_taken: boolean;
  }>;
  initialDoctor?: {
    id: number;
    dr_name: string;
    mobile: string | null;
    p_code: string | null;
    city: string;
    pledge_taken: boolean;
  } | null;
}

interface FormData {
  hcpname: string;
  pCode: string;
  city: string;
  photo: string;
  mobile: string;
}

interface CroppedAreaPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });

const getCroppedImg = async (imageSrc: string, pixelCrop: CroppedAreaPixels): Promise<string> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL('image/jpeg');
};

const HCPDetailsForm: React.FC<HCPDetailsFormProps> = ({ onSubmit, isLoading, error, existingDoctors = [], initialDoctor }) => {
  const [formData, setFormData] = useState<FormData>({
    hcpname: '',
    pCode: '',
    city: '',
    photo: '',
    mobile: ''
  });
  const [existingDoctorId, setExistingDoctorId] = useState<number | undefined>(undefined);
  const [showExistingDoctorMessage, setShowExistingDoctorMessage] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [nameError, setNameError] = useState('');
  const [pCodeError, setPCodeError] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [cityError, setCityError] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedAreaPixels | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter existing doctors based on HCP name input (show all if no search term)
  const filteredDoctors = formData.hcpname.trim()
    ? existingDoctors.filter(doctor =>
        doctor.dr_name.toLowerCase().includes(formData.hcpname.toLowerCase()) ||
        (doctor.p_code && doctor.p_code.toLowerCase().includes(formData.hcpname.toLowerCase()))
      )
    : existingDoctors;

  // Handle clicking outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Auto-fill form when initialDoctor is provided (from HCPList navigation)
  useEffect(() => {
    if (initialDoctor) {
      setFormData({
        hcpname: initialDoctor.dr_name || '',
        mobile: initialDoctor.mobile || '',
        pCode: initialDoctor.p_code || '',
        city: initialDoctor.city || '',
        photo: ''
      });
      setExistingDoctorId(initialDoctor.id);
      setShowExistingDoctorMessage(true);
      
      // Hide message after 3 seconds
      setTimeout(() => {
        setShowExistingDoctorMessage(false);
      }, 3000);
    }
  }, [initialDoctor]);

  // Handle selecting an existing doctor from dropdown
  const handleSelectExistingDoctor = (doctor: typeof existingDoctors[0]) => {
    setFormData({
      hcpname: doctor.dr_name,
      mobile: doctor.mobile || '',
      pCode: doctor.p_code || '',
      city: doctor.city || '',
      photo: ''
    });
    setExistingDoctorId(doctor.id);
    setShowDropdown(false);
    setShowExistingDoctorMessage(true);
    
    // Hide message after 3 seconds
    setTimeout(() => {
      setShowExistingDoctorMessage(false);
    }, 3000);
  };

  // Check for existing doctor when name changes
  useEffect(() => {
    if (formData.hcpname.trim() && existingDoctors.length > 0 && !existingDoctorId) {
      const matchingDoctor = existingDoctors.find(
        doctor => doctor.dr_name.toLowerCase().trim() === formData.hcpname.toLowerCase().trim()
      );

      if (matchingDoctor) {
        // Populate form with existing doctor data
        setFormData(prev => ({
          ...prev,
          mobile: matchingDoctor.mobile || '',
          pCode: matchingDoctor.p_code || '',
          city: matchingDoctor.city || '',
        }));
        setExistingDoctorId(matchingDoctor.id);
        setShowExistingDoctorMessage(true);
        
        // Hide message after 3 seconds
        setTimeout(() => {
          setShowExistingDoctorMessage(false);
        }, 3000);
      } else {
        // Clear existing doctor ID if name doesn't match
        if (existingDoctorId) {
          setExistingDoctorId(undefined);
          setShowExistingDoctorMessage(false);
        }
      }
    }
  }, [formData.hcpname, existingDoctors]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear field-specific errors when user starts typing
    if (name === 'hcpname' && nameError) {
      setNameError('');
    }
    if (name === 'pCode' && pCodeError) {
      setPCodeError('');
    }
    if (name === 'mobile' && mobileError) {
      setMobileError('');
    }
    if (name === 'city' && cityError) {
      setCityError('');
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImageToCrop(base64String);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: CroppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropConfirm = async () => {
    if (imageToCrop && croppedAreaPixels) {
      try {
        const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
        setPhotoPreview(croppedImage);
        setFormData(prev => ({
          ...prev,
          photo: croppedImage
        }));
        setShowCropper(false);
        setImageToCrop(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      } catch (e) {
        console.error('Error cropping image:', e);
      }
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setImageToCrop(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setFormData(prev => ({
      ...prev,
      photo: ''
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset all errors
    setNameError('');
    setPCodeError('');
    setMobileError('');
    setCityError('');
    
    // Custom validation
    let hasError = false;
    
    if (!formData.hcpname.trim()) {
      setNameError('Please enter HCP name');
      hasError = true;
    }
    
    if (!formData.pCode.trim()) {
      setPCodeError('Please enter P. Code');
      hasError = true;
    }
    
    if (!formData.mobile.trim()) {
      setMobileError('Please enter mobile number');
      hasError = true;
    } else if (formData.mobile.length !== 10) {
      setMobileError('Mobile number must be 10 digits');
      hasError = true;
    }
    
    if (!formData.city.trim()) {
      setCityError('Please enter city');
      hasError = true;
    }
    
    if (hasError) {
      return;
    }
    
    if (onSubmit) {
      onSubmit(formData, existingDoctorId);
    }
  };

  const inputClasses = "w-full rounded-xl py-2 px-4 text-base bg-white focus:outline-none focus:shadow-lg focus:shadow-primary/30 transition-shadow placeholder-gray-500";

  return (
     <div className="rounded-2xl p-3 md:p-5 shadow-lg max-w-md formbg">
      <h3 className="text-xl md:text-2xl font-bold text-primary mb-6 text-center">Enter HCP details</h3>
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        {showExistingDoctorMessage && (
          <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg text-sm">
            <strong>Found existing HCP!</strong> Details loaded. You can update them if needed.
          </div>
        )}
        
        <div className="mb-4 relative" ref={dropdownRef}>
          {nameError && (
            <div className="mb-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {nameError}
            </div>
          )}
          <input
            type="text"
            className={inputClasses}
            id="hcpname"
            name="hcpname"
            value={formData.hcpname}
            onChange={handleChange}
            onFocus={() => existingDoctors.length > 0 && setShowDropdown(true)}
            placeholder="Enter HCP Name"
            disabled={isLoading}
            required
          />
          
          {/* Dropdown List */}
          {showDropdown && existingDoctors.length > 0 && filteredDoctors.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-72 overflow-y-auto">
              {/* Search hint */}
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs text-gray-500">
                Search by name or P.Code • {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''} found
              </div>
              {filteredDoctors.map((doctor) => (
                <button
                  key={doctor.id}
                  type="button"
                  onClick={() => handleSelectExistingDoctor(doctor)}
                  className="w-full text-left px-4 py-3 hover:bg-primary/10 border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{doctor.dr_name}</div>
                      <div className="text-sm text-gray-500 mt-0.5">
                        P.Code: {doctor.p_code || 'N/A'}
                      </div>
                    </div>
                    <div className="ml-3 flex-shrink-0">
                      {doctor.pledge_taken ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Pledged
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {showDropdown && existingDoctors.length > 0 && formData.hcpname && filteredDoctors.length === 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500 text-sm">
              No matching HCP found for "{formData.hcpname}"
            </div>
          )}
        </div>

        <div className="mb-4">
          {pCodeError && (
            <div className="mb-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {pCodeError}
            </div>
          )}
          <input
            type="text"
            className={inputClasses}
            id="pCode"
            name="pCode"
            value={formData.pCode}
            onChange={handleChange}
            placeholder="SC. Code"
            disabled={isLoading}
            required
          />
        </div>

        <div className="mb-4">
          {mobileError && (
            <div className="mb-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {mobileError}
            </div>
          )}
          <input
            type="tel"
            className={inputClasses}
            id="mobile"
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
            placeholder="Enter Mobile No"
            disabled={isLoading}
            maxLength={10}
            pattern="[0-9]{10}"
            required
          />
        </div>

        <div className="mb-4">
          {cityError && (
            <div className="mb-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {cityError}
            </div>
          )}
          <input
            type="text"
            className={inputClasses}
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="Enter City"
            disabled={isLoading}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-medium mb-2">Take Photo</label>
          {/* File input for photo */}
          <div className="flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden">
            <label 
              htmlFor="photo"
              className="px-4 py-2 bg-gray-100 border-r border-gray-300 text-gray-700 text-sm cursor-pointer hover:bg-gray-200 whitespace-nowrap"
            >
              Choose File
            </label>
            <span className="px-4 py-2 text-gray-500 text-sm truncate flex-1">
              {photoPreview ? 'Photo selected' : 'No File Chosen'}
            </span>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              id="photo"
              name="photo"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
            />
          </div>
          
          {photoPreview && (
            <div className="relative mt-2">
              <img 
                src={photoPreview} 
                alt="Preview" 
                className="w-full h-32 object-cover rounded-xl"
              />
              <button
                type="button"
                onClick={removePhoto}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
              >
                ×
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-6">
          <small className='text-sm text-gray-600'>(All Fields are mandatory)</small>
          <button 
            type="submit" 
            className="prplbtn1 shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'Submitting...' : 'Next'}
          </button>
        </div>
      </form>

      {/* Cropper Modal */}
      {showCropper && imageToCrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-white rounded-2xl p-4 w-[90%] max-w-md">
            <h4 className="text-lg font-bold text-purple-900 mb-4 text-center">Add Photo</h4>
            <div className="relative w-full h-64 bg-gray-200 rounded-xl overflow-hidden">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="mt-4">
              <label className="text-sm text-gray-600">Zoom</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="flex gap-4 mt-4">
              <button
                type="button"
                onClick={handleCropCancel}
                className="flex-1 py-2 px-4 grybtn1 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCropConfirm}
                className="flex-1 py-2 px-4 prplbtn1 transition-colors"
              >
                Crop & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HCPDetailsForm;
