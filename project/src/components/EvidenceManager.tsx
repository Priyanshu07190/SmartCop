import React, { useState, useRef, useEffect } from 'react';
import { Upload, Camera, Video, Mic, FileText, Search, Filter, Download, Shield, Tag } from 'lucide-react';
import { SupabaseService } from '../services/supabaseService';
import { supabase } from '../services/supabaseService';
import { addActivity } from '../utils/activityLogger';

const EvidenceManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [evidenceItems, setEvidenceItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const supabaseService = SupabaseService.getInstance();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    // Load evidence items from localStorage
    const loadEvidenceItems = () => {
      const items = JSON.parse(localStorage.getItem('evidenceItems') || '[]');
      setEvidenceItems(items);
    };

    loadEvidenceItems();
    
    // Poll for updates every 2 seconds
    const interval = setInterval(loadEvidenceItems, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const saveEvidenceToStorage = async (newItem: any) => {
    // Convert blob to base64 data URL for storage
    if (newItem.blob && newItem.blob instanceof File) {
      try {
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(newItem.blob);
        });
        
        // Store the data URL and file info instead of the blob
        newItem.dataUrl = dataUrl;
        newItem.fileType = newItem.blob.type;
        newItem.fileName = newItem.blob.name;
        delete newItem.blob; // Remove blob before storage
      } catch (error) {
        console.error('Error converting file to data URL:', error);
      }
    }
    
    const existingItems = JSON.parse(localStorage.getItem('evidenceItems') || '[]');
    const updatedItems = [newItem, ...existingItems];
    localStorage.setItem('evidenceItems', JSON.stringify(updatedItems));
    setEvidenceItems(updatedItems);
  };

  const handleTakePhoto = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        // Show video preview
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
          <div class="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 class="text-lg font-semibold mb-4">Take Photo</h3>
            <video id="camera-preview" class="w-full rounded-lg mb-4" autoplay></video>
            <div class="flex space-x-3">
              <button id="capture-btn" class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700">
                Capture
              </button>
              <button id="cancel-btn" class="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400">
                Cancel
              </button>
            </div>
          </div>
        `;
        
        document.body.appendChild(modal);
        
        const preview = modal.querySelector('#camera-preview') as HTMLVideoElement;
        preview.srcObject = stream;
        
        modal.querySelector('#capture-btn')?.addEventListener('click', () => {
          capturePhoto(stream, preview);
          document.body.removeChild(modal);
        });
        
        modal.querySelector('#cancel-btn')?.addEventListener('click', () => {
          stream.getTracks().forEach(track => track.stop());
          document.body.removeChild(modal);
        });
      }
    } catch (error) {
      console.error('Camera access error:', error);
      alert('Camera access denied or not available');
    }
  };

  const capturePhoto = (stream: MediaStream, video: HTMLVideoElement) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context?.drawImage(video, 0, 0);
      
      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], `Photo_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.jpg`, { type: 'image/jpeg' });
          const newItem = {
            id: Date.now().toString(),
            type: 'image',
            name: file.name,
            size: `${(blob.size / 1024 / 1024).toFixed(1)} MB`,
            timestamp: new Date().toLocaleString(),
            tags: ['Auto-captured', 'Camera'],
            aiAnalysis: 'Image captured successfully',
            hash: `hash_${Date.now()}`,
            caseId: 'CASE-2024-001',
            evidenceId: `CASE-2024-001-E${String(Date.now()).slice(-3)}`,
            status: 'verified',
            blob: file
          };
          
          await saveEvidenceToStorage(newItem);
          
          // Add to recent activity and timeline
          addActivity('Evidence', `Photo captured - ${newItem.evidenceId}`, newItem.caseId, {
            evidenceId: newItem.evidenceId,
            fileType: 'image',
            fileName: newItem.name,
            fileSize: newItem.size,
            aiAnalysis: newItem.aiAnalysis,
            tags: newItem.tags,
            status: newItem.status
          });
          
          // Upload to Supabase
          supabaseService.uploadEvidence(file, {
            type: 'image',
            tags: newItem.tags,
            caseId: newItem.caseId,
            aiAnalysis: newItem.aiAnalysis
          });
        }
      }, 'image/jpeg');
    }
    
    stream.getTracks().forEach(track => track.stop());
  };

  const handleRecordVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      
      recorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };
      
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const file = new File([blob], `Video_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`, { type: 'video/webm' });
        const newItem = {
          id: Date.now().toString(),
          type: 'video',
          name: file.name,
          size: `${(blob.size / 1024 / 1024).toFixed(1)} MB`,
          timestamp: new Date().toLocaleString(),
          tags: ['Auto-recorded', 'Video'],
          aiAnalysis: 'Video recorded successfully',
          hash: `hash_${Date.now()}`,
          caseId: 'CASE-2024-001',
          evidenceId: `CASE-2024-001-V${String(Date.now()).slice(-3)}`,
          status: 'verified',
          blob: file
        };
        
        await saveEvidenceToStorage(newItem);
        
        // Add to recent activity and timeline
        addActivity('Evidence', `Video recorded - ${newItem.evidenceId}`, newItem.caseId, {
          evidenceId: newItem.evidenceId,
          fileType: 'video',
          fileName: newItem.name,
          fileSize: newItem.size,
          aiAnalysis: newItem.aiAnalysis,
          tags: newItem.tags,
          status: newItem.status
        });
        
        // Upload to Supabase
        supabaseService.uploadEvidence(file, {
          type: 'video',
          tags: newItem.tags,
          caseId: newItem.caseId,
          aiAnalysis: newItem.aiAnalysis
        });
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setIsRecording(true);
      
      // Show recording modal
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.innerHTML = `
        <div class="bg-white p-6 rounded-lg max-w-md w-full mx-4">
          <h3 class="text-lg font-semibold mb-4">Recording Video</h3>
          <video id="video-preview" class="w-full rounded-lg mb-4" autoplay muted></video>
          <div class="flex items-center justify-center space-x-3">
            <div class="h-3 w-3 bg-red-500 rounded-full animate-pulse"></div>
            <span class="text-red-600 font-medium">Recording...</span>
          </div>
          <button id="stop-recording" class="w-full mt-4 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700">
            Stop Recording
          </button>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      const preview = modal.querySelector('#video-preview') as HTMLVideoElement;
      preview.srcObject = stream;
      
      modal.querySelector('#stop-recording')?.addEventListener('click', () => {
        recorder.stop();
        setIsRecording(false);
        document.body.removeChild(modal);
      });
      
    } catch (error) {
      console.error('Video recording error:', error);
      alert('Camera/microphone access denied or not available');
    }
  };

  const handleRecordAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      
      recorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };
      
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], `Audio_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`, { type: 'audio/webm' });
        const newItem = {
          id: Date.now().toString(),
          type: 'audio',
          name: file.name,
          size: `${(blob.size / 1024 / 1024).toFixed(1)} MB`,
          timestamp: new Date().toLocaleString(),
          tags: ['Auto-recorded', 'Audio'],
          aiAnalysis: 'Audio recorded successfully',
          hash: `hash_${Date.now()}`,
          caseId: 'CASE-2024-001',
          evidenceId: `CASE-2024-001-A${String(Date.now()).slice(-3)}`,
          status: 'verified',
          blob: file
        };
        
        await saveEvidenceToStorage(newItem);
        
        // Add to recent activity and timeline
        addActivity('Evidence', `Audio recorded - ${newItem.evidenceId}`, newItem.caseId, {
          evidenceId: newItem.evidenceId,
          fileType: 'audio',
          fileName: newItem.name,
          fileSize: newItem.size,
          aiAnalysis: newItem.aiAnalysis,
          tags: newItem.tags,
          status: newItem.status
        });
        
        // Upload to Supabase
        supabaseService.uploadEvidence(file, {
          type: 'audio',
          tags: newItem.tags,
          caseId: newItem.caseId,
          aiAnalysis: newItem.aiAnalysis
        });
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setIsRecording(true);
      
      // Show recording modal
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.innerHTML = `
        <div class="bg-white p-6 rounded-lg max-w-md w-full mx-4">
          <h3 class="text-lg font-semibold mb-4">Recording Audio</h3>
          <div class="flex items-center justify-center space-x-3 py-8">
            <div class="h-4 w-4 bg-red-500 rounded-full animate-pulse"></div>
            <span class="text-red-600 font-medium text-lg">Recording Audio...</span>
          </div>
          <button id="stop-audio-recording" class="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700">
            Stop Recording
          </button>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      modal.querySelector('#stop-audio-recording')?.addEventListener('click', () => {
        recorder.stop();
        setIsRecording(false);
        document.body.removeChild(modal);
      });
      
    } catch (error) {
      console.error('Audio recording error:', error);
      alert('Microphone access denied or not available');
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      for (const file of Array.from(files)) {
        const newItem = {
          id: Date.now().toString() + Math.random().toString(),
          type: file.type.startsWith('image/') ? 'image' : 
                file.type.startsWith('video/') ? 'video' : 
                file.type.startsWith('audio/') ? 'audio' : 'document',
          name: file.name,
          size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
          timestamp: new Date().toLocaleString(),
          tags: ['Uploaded', file.type],
          aiAnalysis: 'File uploaded successfully',
          hash: `hash_${Date.now()}`,
          caseId: 'CASE-2024-001',
          evidenceId: `CASE-2024-001-${file.type.startsWith('image/') ? 'E' : 
                      file.type.startsWith('video/') ? 'V' : 
                      file.type.startsWith('audio/') ? 'A' : 'D'}${String(Date.now()).slice(-3)}`,
          status: 'verified',
          blob: file
        };
        
        await saveEvidenceToStorage(newItem);
        
        // Add to recent activity and timeline
        addActivity('Evidence', `File uploaded - ${newItem.evidenceId}`, newItem.caseId, {
          evidenceId: newItem.evidenceId,
          fileType: newItem.type,
          fileName: newItem.name,
          fileSize: newItem.size,
          aiAnalysis: newItem.aiAnalysis,
          tags: newItem.tags,
          status: newItem.status
        });
        
        // Upload to Supabase
        supabaseService.uploadEvidence(file, {
          type: newItem.type,
          tags: newItem.tags,
          caseId: newItem.caseId,
          aiAnalysis: newItem.aiAnalysis
        });
      }
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Camera className="h-5 w-5 text-blue-600" />;
      case 'video':
        return <Video className="h-5 w-5 text-green-600" />;
      case 'audio':
        return <Mic className="h-5 w-5 text-purple-600" />;
      case 'document':
        return <FileText className="h-5 w-5 text-orange-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const downloadEvidence = (item: any) => {
    // Try to download from stored data URL first
    if (item.dataUrl) {
      try {
        // Convert data URL back to blob and create download
        fetch(item.dataUrl)
          .then(res => res.blob())
          .then(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = item.fileName || item.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          })
          .catch(error => {
            console.error('Error downloading from data URL:', error);
            // Fallback to direct data URL download
            const a = document.createElement('a');
            a.href = item.dataUrl;
            a.download = item.fileName || item.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          });
        return;
      } catch (error) {
        console.error('Error processing data URL:', error);
      }
    }
    
    // Legacy support: if item still has blob
    if (item.blob) {
      const url = URL.createObjectURL(item.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      // If no dataUrl or blob, try to download from Supabase storage
      const { data } = supabase.storage
        .from('evidence')
        .getPublicUrl(item.file_path || item.name);
      
      if (data.publicUrl) {
        const a = document.createElement('a');
        a.href = data.publicUrl;
        a.download = item.name;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        alert('Unable to download file. The file may have been moved or deleted.');
      }
    }
  };
  const filteredItems = activeTab === 'all' 
    ? evidenceItems.filter(item => 
        searchTerm === '' || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.evidenceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.caseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : evidenceItems.filter(item => 
        item.type === activeTab && (
          searchTerm === '' || 
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.evidenceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.caseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      );

  return (
    <div className="p-6 space-y-6">
      {/* Upload Zone */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={handleTakePhoto}
            className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors"
          >
            <Camera className="h-8 w-8 text-gray-400 mb-2" />
            <span className="text-sm font-medium text-gray-700">Take Photo</span>
          </button>
          
          <button
            onClick={handleRecordVideo}
            disabled={isRecording}
            className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 transition-colors disabled:opacity-50"
          >
            <Video className="h-8 w-8 text-gray-400 mb-2" />
            <span className="text-sm font-medium text-gray-700">Record Video</span>
          </button>
          
          <button
            onClick={handleRecordAudio}
            disabled={isRecording}
            className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 transition-colors disabled:opacity-50"
          >
            <Mic className="h-8 w-8 text-gray-400 mb-2" />
            <span className="text-sm font-medium text-gray-700">Record Audio</span>
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-400 transition-colors"
          >
            <Upload className="h-8 w-8 text-gray-400 mb-2" />
            <span className="text-sm font-medium text-gray-700">Select Files</span>
          </button>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search evidence..."
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            {['all', 'image', 'video', 'audio', 'document'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Evidence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredItems.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Camera className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No evidence items yet</p>
            <p className="text-gray-400">Start by taking a photo or uploading files</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(item.type)}
                    <span className="font-medium text-gray-900 truncate">{item.name}</span>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Size:</span>
                    <span>{item.size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time:</span>
                    <span>{item.timestamp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Case ID:</span>
                    <span className="font-mono text-blue-600">{item.caseId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Evidence ID:</span>
                    <span className="font-mono text-green-600">{item.evidenceId}</span>
                  </div>
                </div>

                <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-700 mb-1">AI Analysis:</p>
                  <p className="text-xs text-gray-600">{item.aiAnalysis}</p>
                </div>

                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-700 mb-2">Auto-detected Tags:</p>
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag: string, index: number) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Shield className="h-3 w-3" />
                      <span>Hash:</span>
                    </div>
                    <span className="font-mono">{item.hash}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <button 
                    onClick={() => downloadEvidence(item)}
                    className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded"
                  >
                    <Download className="h-3 w-3" />
                    <span>Download</span>
                  </button>
                  
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems([...selectedItems, item.id]);
                      } else {
                        setSelectedItems(selectedItems.filter(id => id !== item.id));
                      }
                    }}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Hidden elements for camera functionality */}
      <video ref={videoRef} className="hidden" />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default EvidenceManager;