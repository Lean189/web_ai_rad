import os
import pydicom

def anonymize_dicom(input_path: str, output_path: str):
    """
    Anonymizes a DICOM file by removing/modifying tags containing PII using pydicom.
    """
    try:
        ds = pydicom.dcmread(input_path)
        
        # Basic anonymization: remove common PII tags
        tags_to_clear = [
            (0x0010, 0x0010), # Patient's Name
            (0x0010, 0x0020), # Patient ID
            (0x0010, 0x0030), # Patient's Birth Date
            (0x0010, 0x0040), # Patient's Sex
            (0x0008, 0x0080), # Institution Name
            (0x0008, 0x0081), # Institution Address
            (0x0008, 0x1030), # Study Description
            (0x0008, 0x103E), # Series Description
        ]
        
        for tag in tags_to_clear:
            if tag in ds:
                vr = ds[tag].VR
                if vr == 'DA':
                    ds[tag].value = '' # Empty date is usually valid
                elif vr == 'AS':
                    ds[tag].value = '000Y'
                elif tag == (0x0010, 0x0040): # Patient's Sex
                    ds[tag].value = 'O' # Other
                else:
                    ds[tag].value = "ANONYMOUS"
        
        ds.save_as(output_path)
        return True
    except Exception as e:
        print(f"Error anonymizing DICOM with pydicom: {e}")
        return False

# Example usage/test
if __name__ == "__main__":
    # This would be used during processing
    pass
