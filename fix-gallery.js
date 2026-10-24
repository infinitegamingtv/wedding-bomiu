const fs = require('fs');
let c = fs.readFileSync('src/app/admin/page.js', 'utf8');

// Inject newImageUrl state
if (!c.includes('const [newImageUrl, setNewImageUrl]')) {
    c = c.replace(
        "const [activeTab, setActiveTab] = useState('dashboard');",
        "const [activeTab, setActiveTab] = useState('dashboard');\n  const [newImageUrl, setNewImageUrl] = useState('');"
    );
}

// Gallery tab replacement
const oldGalleryTab = /\{activeTab === 'gallery' && \([\s\S]*?<\/div>\s*\)\}/;

const newGalleryTab = `{activeTab === 'gallery' && (
          <div>
            <div className={styles.header}>
              <h1 className={styles.pageTitle}>Quản lý Ảnh Album</h1>
            </div>
            
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Thêm ảnh mới</h2>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <input 
                  className={styles.input} 
                  placeholder="Nhập đường dẫn URL của ảnh (VD: https://...)" 
                  value={newImageUrl} 
                  onChange={e => setNewImageUrl(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newImageUrl.trim()) {
                      setData(prev => ({ ...prev, albums: [...(prev.albums || []), { url: newImageUrl.trim() }] }));
                      setNewImageUrl('');
                    }
                  }}
                />
                <button 
                  className={styles.buttonPrimary} 
                  style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }} 
                  onClick={() => {
                    if (newImageUrl.trim()) {
                      setData(prev => ({ ...prev, albums: [...(prev.albums || []), { url: newImageUrl.trim() }] }));
                      setNewImageUrl('');
                    }
                  }}
                >
                  <Icon icon={Plus} size={16} /> Thêm ảnh
                </button>
              </div>
              
              <h2 className={styles.cardTitle}>Danh sách ảnh ({data.albums?.length || 0})</h2>
              <div className={styles.photoGrid}>
                {data.albums?.map((img, i) => (
                  <div key={i} className={styles.photoItem}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="Album" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                    <button 
                      title="Xóa ảnh này" 
                      onClick={() => {
                        if (confirm('Bạn có chắc muốn xóa ảnh này khỏi album?')) {
                          setData(prev => ({ ...prev, albums: prev.albums.filter((_, idx) => idx !== i) }));
                        }
                      }}
                      style={{
                        position: 'absolute', top: 8, right: 8, 
                        background: 'rgba(220,53,69,0.9)', color: 'white', 
                        border: 'none', borderRadius: '50%', 
                        width: 28, height: 28, cursor: 'pointer', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      <Icon icon={Trash2} size={14} />
                    </button>
                  </div>
                ))}
              </div>
              {!(data.albums?.length) && <p style={{color: '#888', textAlign: 'center', padding: '20px'}}>Chưa có ảnh nào trong album.</p>}
            </div>
          </div>
        )}`;

if (c.match(oldGalleryTab)) {
    c = c.replace(oldGalleryTab, newGalleryTab);
    fs.writeFileSync('src/app/admin/page.js', c, 'utf8');
    console.log("Gallery tab updated");
} else {
    console.log("Could not find gallery tab to replace");
}
