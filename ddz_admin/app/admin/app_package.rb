require 'uri'

ActiveAdmin.register AppPackage do
  permit_params do
    permitted = []
    permitted << :appPackageId
    permitted << :appPackageName
    permitted << :description
    permitted << :enabled
    permitted << :baseUrl
    permitted << :updateUrl
    permitted << :versionUrl
    permitted << :manifestUrl
    permitted << :storagePath
    permitted << :engineVersion
    permitted
  end

  member_action :new_version, method: :post do

    newParams = params[:app_update_info]

    searchPaths = []
    unless newParams[:searchPaths].blank?
      searchPaths = newParams[:searchPaths].split(%r{[,;\n]}).collect { |s| s.strip }
    end


    pkgFilePath = resource.storagePath.gsub(':pkg_id:', resource.appPackageId)
    pkgFilePath = File.join(Rails.root, 'public', pkgFilePath)
    updateFilesPath = File.join(pkgFilePath, 'updates')

    FileUtils.remove_dir(updateFilesPath, true) if File.exists?(updateFilesPath)
    FileUtils.makedirs updateFilesPath

    zipFile = newParams[:zipFile]
    assets = {}
    Zip::File.open(zipFile.tempfile.path) do |entries|
      entries.each do |entry|
        dst_file = File.join(updateFilesPath, entry.name)
        unless entry.name_is_directory?
          dst_dir = File.dirname(dst_file)
          FileUtils.makedirs(dst_dir) unless File.exists?(dst_dir)
        end
        entry.extract dst_file, proc { true }
        unless entry.name_is_directory?
          entry.get_input_stream do |fis|
            md5 = ::Digest::MD5.new
            md5.update(fis.read)
            assets[entry.name] = {md5: md5.hexdigest}
          end
        end
      end
    end

    uploadedVersionInfo = JSON.parse(IO.read(File.join(updateFilesPath, 'versionInfo.json')))
    updateVersion = uploadedVersionInfo["version"] + "_" + uploadedVersionInfo["timestamp"]


    versionInfo = {
        packageUrl: URI.join(resource.baseUrl, resource.updateUrl).to_s.gsub(':pkg_id:', resource.appPackageId),
        remoteVersionUrl: URI.join(resource.baseUrl, resource.versionUrl).to_s.gsub(':pkg_id:', resource.appPackageId),
        remoteManifestUrl: URI.join(resource.baseUrl, resource.manifestUrl).to_s.gsub(':pkg_id:', resource.appPackageId),
        version: updateVersion,
        engineVersion: resource.engineVersion
    }

    File.open(File.join(pkgFilePath, 'version.json'), "w") do |file|
      file.puts versionInfo.to_json
    end

    versionInfo["searchPaths"] = searchPaths
    versionInfo["assets"] = assets

    File.open(File.join(pkgFilePath, 'manifest.json'), "w") do |file|
      file.puts versionInfo.to_json
    end

    newInfo = AppUpdateInfo.new
    newInfo.app_package = resource
    newInfo.appVersion = uploadedVersionInfo["version"]
    newInfo.resVersion = updateVersion
    newInfo.searchPaths = newParams[:searchPaths]
    newInfo.enabled = true
    newInfo.app_package = resource
    newInfo.save!

    redirect_to action: :show
  end

  index do
    selectable_column
    id_column
    column :appPackageId
    column :appPackageName
    column :description
    column :enabled
    column :baseUrl
    column :updateUrl
    column :versionUrl
    column :manifestUrl
    column :storagePath
    column :engineVersion
    column :created_at
    column :updated_at
    actions
  end

  filter :appPackageId
  filter :appPackageName
  filter :enabled

  form do |f|
    f.inputs "App Package Details" do
      f.input :appPackageId, required: true
      f.input :appPackageName, required: true
      f.input :description, required: true
      f.input :enabled, as: :boolean
      f.input :baseUrl
      f.input :updateUrl
      f.input :versionUrl
      f.input :manifestUrl
      f.input :storagePath
      f.input :engineVersion
    end
    f.actions
  end

  show do |appPackage|

    attributes_table do
      row :id
      row :appPackageId
      row :appPackageName
      row :description
      row :enabled
      row :baseUrl
      row :updateUrl
      row :versionUrl
      row :manifestUrl
      row :storagePath
      row :created_at
      row :updated_at
    end

    div "Package Update Infos" do
      table_for appPackage.app_update_infos do
        column "App Version", :appVersion
        column "Res Version", :resVersion
        column "Enabled", :enabled
        column :created_at
        column :updated_at
      end

      render partial: 'new_version_info'

    end

  end

end
