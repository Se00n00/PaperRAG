import requests
import fitz

def get_pdf_content(pdf_url):
    """
    Downloads a PDF from a URL and extracts its text content.
    """
    try:
        response = requests.get(pdf_url)
        response.raise_for_status()  # This will raise an HTTPError if the response was an error
        pdf_document = fitz.open(stream=response.content, filetype="pdf")
        
        text_content = ""
        for page_num in range(pdf_document.page_count):
            page = pdf_document.load_page(page_num)
            text_content += page.get_text()
            
        return text_content
        
    except requests.exceptions.RequestException as e:
        print(f"Error downloading the PDF: {e}")
        return None
    except Exception as e:
        print(f"An error occurred: {e}")
        return None