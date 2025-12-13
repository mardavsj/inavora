import { useState, useEffect } from 'react';
import { Video, Link, Upload, X } from 'lucide-react';
import SlideTypeHeader from '../common/SlideTypeHeader';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { translateError } from '../../../utils/errorTranslator';
import { uploadVideo as uploadVideoService } from '../../../services/presentationService';

const VideoEditor = ({ slide, onUpdate }) => {
  const { t } = useTranslation();
  const [question, setQuestion] = useState(slide?.question || '');
  const [videoUrl, setVideoUrl] = useState(slide?.videoUrl || '');
  const [videoPublicId, setVideoPublicId] = useState(slide?.videoPublicId || '');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMethod, setUploadMethod] = useState('url'); // 'url' or 'file'

  useEffect(() => {
    if (slide) {
      setQuestion(slide.question || '');
      setVideoUrl(slide.videoUrl || '');
      setVideoPublicId(slide.videoPublicId || '');
      
      // If video exists but no publicId, it's likely a URL-based video
      if (slide.videoUrl && !slide.videoPublicId) {
        setUploadMethod('url');
      } else if (slide.videoPublicId) {
        setUploadMethod('file');
      }
    }
  }, [slide]);

  const handleQuestionChange = (value) => {
    setQuestion(value);
    onUpdate({ ...slide, question: value });
  };

  const handleVideoUrlChange = (value) => {
    setVideoUrl(value);
    onUpdate({ ...slide, videoUrl: value });
  };

  // Extract video ID from YouTube URL for preview
  const getYoutubeEmbedUrl = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  // Check if URL is a valid video URL
  const isValidVideoUrl = (url) => {
    return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com');
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if file is a video
    if (!file.type.startsWith('video/')) {
      toast.error(t('slide_editors.video.upload_video_error'));
      return;
    }

    // Check file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast.error(t('slide_editors.video.video_size_error'));
      return;
    }

    setIsUploading(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64Video = event.target.result;
          const response = await uploadVideoService(base64Video);

          if (response.success) {
            setVideoUrl(response.data.videoUrl);
            setVideoPublicId(response.data.publicId);
            onUpdate({ 
              ...slide, 
              videoUrl: response.data.videoUrl,
              videoPublicId: response.data.publicId
            });
            toast.success(t('slide_editors.video.upload_success'));
          }
        } catch (error) {
          console.error('Upload error:', error);
          const errorMessage = error?.response?.data?.error || error?.message || 'Failed to upload video';
          toast.error(translateError(error, t, 'slide_editors.video.upload_failed'));
        } finally {
          setIsUploading(false);
        }
      };
      
      reader.onerror = () => {
        toast.error(t('slide_editors.video.upload_video_error'));
        setIsUploading(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Video processing error:', error);
      toast.error(translateError(error, t, 'slide_editors.video.upload_failed'));
      setIsUploading(false);
    }
  };

  const handleRemoveVideo = () => {
    setVideoUrl('');
    setVideoPublicId('');
    onUpdate({ 
      ...slide, 
      videoUrl: '',
      videoPublicId: null
    });
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin bg-[#1F1F1F] text-[#E0E0E0]">
      <SlideTypeHeader type="video" />

      <div className="p-4 border-b border-[#2A2A2A]">
        <label className="block text-sm font-medium text-[#E0E0E0] mb-2">
          {t('slide_editors.video.title_label')}
        </label>
        <input
          type="text"
          value={question}
          onChange={(e) => handleQuestionChange(e.target.value)}
          className="w-full px-3 py-2 border border-[#2A2A2A] rounded-lg text-sm bg-[#232323] text-[#E0E0E0] placeholder-[#8A8A8A] focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent outline-none"
          placeholder={t('slide_editors.video.title_placeholder')}
        />
      </div>

      <div className="p-4 border-b border-[#2A2A2A]">
        <label className="block text-sm font-medium text-[#E0E0E0] mb-2">
          {t('slide_editors.video.video_label')}
        </label>
        
        {videoUrl ? (
          <div className="space-y-3">
            <div className="relative">
              {isValidVideoUrl(videoUrl) ? (
                <div className="rounded-lg overflow-hidden border border-[#2A2A2A] bg-[#232323]">
                  <div className="aspect-video bg-black flex items-center justify-center">
                    <iframe
                      src={getYoutubeEmbedUrl(videoUrl)}
                      title={t('slide_editors.video.preview_title')}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-lg overflow-hidden border border-[#2A2A2A] bg-[#232323]">
                  <div className="aspect-video bg-black flex items-center justify-center">
                    <video
                      src={videoUrl}
                      controls
                      className="w-full h-full"
                      onError={(e) => {
                        toast.error(t('slide_editors.video.video_load_error'));
                      }}
                    >
                      {t('slide_editors.video.video_not_supported')}
                    </video>
                  </div>
                </div>
              )}
              <button
                onClick={handleRemoveVideo}
                className="absolute top-2 right-2 p-1.5 bg-[#EF5350] rounded-full hover:bg-[#E53935] transition-colors"
                title={t('slide_editors.video.remove_video_title')}
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Upload Method Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setUploadMethod('url')}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  uploadMethod === 'url'
                    ? 'bg-[#4CAF50] text-white'
                    : 'bg-[#2A2A2A] text-[#9E9E9E] hover:bg-[#333333]'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Link className="h-4 w-4" />
                  <span className="text-sm font-medium">{t('slide_editors.video.add_url')}</span>
                </div>
              </button>
              <button
                onClick={() => setUploadMethod('file')}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  uploadMethod === 'file'
                    ? 'bg-[#4CAF50] text-white'
                    : 'bg-[#2A2A2A] text-[#9E9E9E] hover:bg-[#333333]'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Upload className="h-4 w-4" />
                  <span className="text-sm font-medium">{t('slide_editors.video.upload_file')}</span>
                </div>
              </button>
            </div>

            {/* URL Input Method */}
            {uploadMethod === 'url' && (
              <div className="border-2 border-dashed border-[#2A2A2A] rounded-lg p-6 bg-[#232323]">
                <div className="flex items-center justify-center mb-3">
                  <Link className="h-10 w-10 text-[#9E9E9E]" />
                </div>
                <p className="text-sm text-[#9E9E9E] mb-3 text-center">{t('slide_editors.video.url_prompt')}</p>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Link className="h-4 w-4 text-[#9E9E9E]" />
                  </div>
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => handleVideoUrlChange(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-[#2A2A2A] rounded-lg text-sm bg-[#1F1F1F] text-[#E0E0E0] placeholder-[#8A8A8A] focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent outline-none"
                    placeholder={t('slide_editors.video.url_placeholder', { 
                      youtube: t('slide_editors.video.youtube_label'),
                      video: t('slide_editors.video.video_label')
                    })}
                  />
                </div>
                <p className="text-xs text-[#7E7E7E] mt-2 text-center">{t('slide_editors.video.url_hint', { 
                  youtube: t('slide_editors.video.youtube_label'),
                  video: t('slide_editors.video.video_label')
                })}</p>
              </div>
            )}

            {/* File Upload Method */}
            {uploadMethod === 'file' && (
              <div className="border-2 border-dashed border-[#2A2A2A] rounded-lg p-6 text-center bg-[#232323]">
                <Video className="h-10 w-10 text-[#9E9E9E] mx-auto mb-3" />
                <p className="text-sm text-[#9E9E9E] mb-3">{t('slide_editors.video.upload_prompt')}</p>
                <label className="inline-flex items-center px-4 py-2 bg-[#4CAF50] text-white rounded-lg hover:bg-[#43A047] transition-colors cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? t('slide_editors.video.uploading') : t('slide_editors.video.choose_file')}
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
                <p className="text-xs text-[#7E7E7E] mt-2">{t('slide_editors.video.max_size')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoEditor;