use std::collections::HashMap;

#[derive(Debug)]
pub struct LayerInfo {
    pub layer_id: i32,
    pub name: String,
    pub is_background_layer: bool,
    pub is_allow_add: bool,
    pub is_current_layer: bool,
    pub is_visible: bool,
    pub is_deleted: bool,
    pub is_allow_up: bool,
    pub is_allow_down: bool,
}

#[derive(Debug)]
pub struct Footer {
    pub file: HashMap<String, String>,
    pub cover: HashMap<String, String>,
    pub keyword: HashMap<String, Vec<String>>,
    pub title: HashMap<String, Vec<String>>,
    pub style: HashMap<String, String>,
    pub page: HashMap<String, String>,
}

#[derive(Debug)]
pub struct Cover {
    pub bitmap_buffer: Option<Vec<u8>>,
}

#[derive(Debug)]
pub struct Supernote {
    pub page_width: u32,
    pub page_height: u32,
    pub address_size: u32,
    pub length_field_size: u32,
    pub signature: String,
    pub version: u32,
    pub default_layers: Vec<String>,
    pub header: Header,
    pub footer: Footer,
    pub keywords: HashMap<String, Vec<Keyword>>,
    pub titles: HashMap<String, Vec<Title>>,
    pub pages: Vec<Page>,
    pub cover: Option<Cover>,
}

pub type Rectangle = (String, String, String, String);

#[derive(Debug)]
pub struct Header {
    pub module_label: String,
    pub file_type: String,
    pub apply_equipment: String,
    pub final_operation_page: String,
    pub final_operation_layer: String,
    pub original_style: String,
    pub original_style_md5: String,
    pub device_dpi: String,
    pub soft_dpi: String,
    pub file_parse_type: String,
    pub ratta_etmd: String,
    pub app_version: String,
    pub file_recogn_type: String,
}

#[derive(Debug)]
pub struct Keyword {
    pub keyword_seq_no: String,
    pub keyword_page: String,
    pub keyword_rect: Rectangle,
    pub keyword_rect_ori: Rectangle,
    pub keyword_site: String,
    pub keyword_len: String,
    pub keyword: String,
    pub bitmap_buffer: Option<Vec<u8>>,
}

#[derive(Debug)]
pub struct Title {
    pub title_seq_no: String,
    pub title_level: String,
    pub title_rect: Rectangle,
    pub title_rect_ori: Rectangle,
    pub title_bitmap: String,
    pub title_protocol: String,
    pub title_style: String,
    pub bitmap_buffer: Option<Vec<u8>>,
}

#[derive(Debug)]
pub enum LayerNames {
    MainLayer,
    Layer1,
    Layer2,
    Layer3,
    BgLayer,
}

#[derive(Debug)]
pub struct Layer {
    pub layer_type: String,
    pub layer_protocol: String,
    pub layer_name: LayerNames,
    pub layer_path: String,
    pub layer_bitmap: String,
    pub layer_vector_graph: String,
    pub layer_recogn: String,
    pub bitmap_buffer: Option<Vec<u8>>,
}

#[derive(Debug)]
pub enum RecognitionStatuses {
    None,
    Done,
    Running,
}

#[derive(Debug)]
pub struct RecognitionElement {
    pub label: String,
    pub r#type: String,
    pub words: Vec<Word>,
}

#[derive(Debug)]
pub struct Word {
    pub label: String,
    pub bounding_box: Option<BoundingBox>,
}

#[derive(Debug)]
pub struct BoundingBox {
    pub height: u32,
    pub width: u32,
    pub x: u32,
    pub y: u32,
}

#[derive(Debug)]
pub struct Page {
    pub page_style: String,
    pub page_style_md5: String,
    pub layer_switch: String,
    pub main_layer: Layer,
    pub layer1: Layer,
    pub layer2: Layer,
    pub layer3: Layer,
    pub bg_layer: Layer,
    pub layer_info: Vec<LayerInfo>,
    pub layer_seq: Vec<LayerNames>,
    pub total_path: String,
    pub thumbnail_type: String,
    pub recogn_status: RecognitionStatuses,
    pub recogn_text: String,
    pub recogn_file: String,
    pub recogn_file_status: RecognitionStatuses,
    pub recognition_elements: Vec<RecognitionElement>,
    pub paragraphs: String,
    pub text: String,
    pub total_path_buffer: Option<Vec<u8>>,
}