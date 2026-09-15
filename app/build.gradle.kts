plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
    id("com.chaquo.python")
}

android {
    namespace = "com.kemsinin.downloader"
    compileSdk {
        version = release(37)
    }

    buildFeatures {
        compose = true
    }

    defaultConfig {
        applicationId = "com.kemsinin.downloader"
        minSdk = 26
        targetSdk = 37
        versionCode = 4
        versionName = "1.3"

        ndk {
            // Chaquopy 17 + Python 3.12 supports 64-bit ABIs only.
            abiFilters += listOf("arm64-v8a", "x86_64")
        }
    }

    signingConfigs {
        create("release") {
            val ksFile = file("../keystore/kemsinin-release.jks")
            if (ksFile.exists()) {
                storeFile = ksFile
                storePassword = "kemsinin2026"
                keyAlias = "kemsinin"
                keyPassword = "kemsinin2026"
            }
        }
    }

    buildTypes {
        release {
            optimization {
                enable = false
            }
            if (file("../keystore/kemsinin-release.jks").exists()) {
                signingConfig = signingConfigs.getByName("release")
            } else {
                signingConfig = signingConfigs.getByName("debug")
            }
        }
    }

    // Per-ABI APKs: each phone only downloads the native libs it needs,
    // roughly halving the installed size (Python/yt-dlp are the bulk).
    splits {
        abi {
            isEnable = true
            reset()
            include("arm64-v8a", "x86_64")
            isUniversalApk = true
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
}

dependencies {
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.material.icons.extended)
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.coil.compose)
    debugImplementation(libs.androidx.compose.ui.tooling)
}

chaquopy {
    defaultConfig {
        version = "3.12"

        val localPy = file("C:/Users/KSN REELSHORT/AppData/Roaming/uv/python/cpython-3.12.14-windows-x86_64-none/python.exe")
        if (localPy.exists()) {
            buildPython(localPy.absolutePath)
        }

        pip {
            install("yt-dlp")
        }
    }
}
